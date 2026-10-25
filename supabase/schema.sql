-- Central: database schema for Supabase.
-- Run this once in the Supabase dashboard (SQL Editor > New query > Run).
-- Every table has row-level security: a PAX can only see regions they belong
-- to, and the posts, events, chats and people inside those regions.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  bio text not null default '' check (char_length(bio) <= 1000),
  avatar_url text,
  created_at timestamptz not null default now()
);
-- Each PAX's "repository of information" will hang off profiles.id later.

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.region_members (
  region_id uuid not null references public.regions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (region_id, user_id)
);
create index region_members_user_idx on public.region_members (user_id);

create table public.invites (
  code text primary key default substr(md5(gen_random_uuid()::text), 1, 12),
  region_id uuid not null references public.regions (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz default now() + interval '14 days',
  max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  location text not null default '' check (char_length(location) <= 300),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_region_time_idx on public.events (region_id, starts_at);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null default '' check (char_length(body) <= 10000),
  link_url text check (link_url is null or link_url ~* '^https?://'),
  image_urls text[] not null default '{}',
  event_id uuid references public.events (id) on delete set null,
  is_notice boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_region_time_idx on public.posts (region_id, created_at desc);
create index posts_time_idx on public.posts (created_at desc);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_private boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.chat_members (
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
create index chat_members_user_idx on public.chat_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_chat_time_idx on public.messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- Access helpers (security definer so policies can call them without
-- recursing into each other's row-level security)
-- ---------------------------------------------------------------------------

create function public.is_region_member(r uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from region_members where region_id = r and user_id = auth.uid()
  );
$$;

create function public.is_region_admin(r uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from region_members
    where region_id = r and user_id = auth.uid() and role = 'admin'
  );
$$;

create function public.shares_region(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from region_members a
    join region_members b on a.region_id = b.region_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create function public.can_access_chat(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chats ch
    where ch.id = c
      and public.is_region_member(ch.region_id)
      and (
        not ch.is_private
        or exists (select 1 from chat_members cm where cm.chat_id = c and cm.user_id = auth.uid())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- New users get a profile automatically
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Functions the app calls for multi-step actions
-- ---------------------------------------------------------------------------

-- Creates a region with the caller as its admin and an open "General" chat.
-- Each PAX can create at most one region per 24 hours.
create function public.create_region(p_name text, p_description text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid;
declare last_created timestamptz;
declare hours_left int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  -- Serialize per PAX so two simultaneous requests can't both pass the check.
  perform pg_advisory_xact_lock(hashtext('create_region:' || auth.uid()::text));
  select max(created_at) into last_created from regions where created_by = auth.uid();
  if last_created > now() - interval '24 hours' then
    hours_left := ceil(extract(epoch from last_created + interval '24 hours' - now()) / 3600)::int;
    raise exception 'You can create one region per day. Try again in % hour%.',
      hours_left, case when hours_left = 1 then '' else 's' end;
  end if;
  insert into regions (name, description, created_by)
  values (p_name, coalesce(p_description, ''), auth.uid())
  returning id into rid;
  insert into region_members (region_id, user_id, role) values (rid, auth.uid(), 'admin');
  insert into chats (region_id, name, is_private, created_by) values (rid, 'General', false, auth.uid());
  return rid;
end;
$$;

-- Lets someone holding an invite link see which region it is for.
create function public.get_invite(p_code text)
returns table (region_id uuid, region_name text, region_description text, valid boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.description,
         (i.expires_at is null or i.expires_at > now())
           and (i.max_uses is null or i.uses < i.max_uses)
  from invites i join regions r on r.id = i.region_id
  where i.code = p_code;
$$;

create function public.redeem_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invites;
declare added int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into inv from invites where code = p_code for update;
  if not found then raise exception 'Invite not found'; end if;
  if public.is_region_member(inv.region_id) then return inv.region_id; end if;
  if inv.expires_at is not null and inv.expires_at <= now() then raise exception 'Invite has expired'; end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then raise exception 'Invite has been used up'; end if;
  insert into region_members (region_id, user_id) values (inv.region_id, auth.uid())
  on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then update invites set uses = uses + 1 where code = p_code; end if;
  return inv.region_id;
end;
$$;

-- Creates a chat group. Private chats only include the caller plus the
-- invited PAX (who must belong to the region).
create function public.create_chat(p_region uuid, p_name text, p_private boolean, p_members uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if not public.is_region_member(p_region) then raise exception 'Not a member of this region'; end if;
  insert into chats (region_id, name, is_private, created_by)
  values (p_region, p_name, p_private, auth.uid())
  returning id into cid;
  if p_private then
    insert into chat_members (chat_id, user_id)
    select cid, m.user_id from region_members m
    where m.region_id = p_region
      and (m.user_id = auth.uid() or m.user_id = any (coalesce(p_members, '{}')))
    on conflict do nothing;
  end if;
  return cid;
end;
$$;

-- Invites more PAX into a private chat the caller is already in.
create function public.add_chat_members(p_chat uuid, p_members uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare ch chats;
begin
  select * into ch from chats where id = p_chat;
  if not found or not public.can_access_chat(p_chat) then raise exception 'Chat not found'; end if;
  if not ch.is_private then return; end if;
  insert into chat_members (chat_id, user_id)
  select p_chat, m.user_id from region_members m
  where m.region_id = ch.region_id and m.user_id = any (p_members)
  on conflict do nothing;
end;
$$;

revoke execute on function public.create_region(text, text) from anon;
revoke execute on function public.redeem_invite(text) from anon;
revoke execute on function public.create_chat(uuid, text, boolean, uuid[]) from anon;
revoke execute on function public.add_chat_members(uuid, uuid[]) from anon;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.region_members enable row level security;
alter table public.invites enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

create policy "see self and fellow PAX" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_region(id));
create policy "edit own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members see region" on public.regions for select to authenticated
  using (public.is_region_member(id));
create policy "admins edit region" on public.regions for update to authenticated
  using (public.is_region_admin(id));
create policy "admins delete region" on public.regions for delete to authenticated
  using (public.is_region_admin(id));

create policy "members see members" on public.region_members for select to authenticated
  using (public.is_region_member(region_id));
create policy "admins change roles" on public.region_members for update to authenticated
  using (public.is_region_admin(region_id)) with check (public.is_region_admin(region_id));
create policy "leave or remove" on public.region_members for delete to authenticated
  using (user_id = auth.uid() or public.is_region_admin(region_id));

create policy "members see invites" on public.invites for select to authenticated
  using (public.is_region_member(region_id));
create policy "members create invites" on public.invites for insert to authenticated
  with check (public.is_region_member(region_id) and created_by = auth.uid());
create policy "revoke invites" on public.invites for delete to authenticated
  using (created_by = auth.uid() or public.is_region_admin(region_id));

create policy "members see events" on public.events for select to authenticated
  using (public.is_region_member(region_id));
create policy "members add events" on public.events for insert to authenticated
  with check (public.is_region_member(region_id) and created_by = auth.uid());
create policy "owner or admin edits events" on public.events for update to authenticated
  using (created_by = auth.uid() or public.is_region_admin(region_id))
  with check (public.is_region_member(region_id));
create policy "owner or admin deletes events" on public.events for delete to authenticated
  using (created_by = auth.uid() or public.is_region_admin(region_id));

-- Only region admins can make a post a notice (pinned to the region page).
create policy "members see posts" on public.posts for select to authenticated
  using (public.is_region_member(region_id));
create policy "members post" on public.posts for insert to authenticated
  with check (
    public.is_region_member(region_id) and author_id = auth.uid()
    and (not is_notice or public.is_region_admin(region_id))
  );
create policy "author or admin edits posts" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_region_admin(region_id))
  with check (
    public.is_region_member(region_id)
    and (not is_notice or public.is_region_admin(region_id))
  );
create policy "author or admin deletes posts" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_region_admin(region_id));

-- Subqueries on posts are themselves filtered by the posts policies above.
create policy "see reactions" on public.reactions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "react" on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy "unreact" on public.reactions for delete to authenticated
  using (user_id = auth.uid());

create policy "see comments" on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "comment" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy "author or admin deletes comments" on public.comments for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_id and public.is_region_admin(p.region_id))
  );

create policy "see accessible chats" on public.chats for select to authenticated
  using (public.can_access_chat(id));
create policy "creator or admin renames chat" on public.chats for update to authenticated
  using (created_by = auth.uid() or public.is_region_admin(region_id))
  with check (public.is_region_member(region_id));
create policy "creator or admin deletes chat" on public.chats for delete to authenticated
  using (created_by = auth.uid() or public.is_region_admin(region_id));

create policy "see chat members" on public.chat_members for select to authenticated
  using (public.can_access_chat(chat_id));
create policy "leave private chat" on public.chat_members for delete to authenticated
  using (user_id = auth.uid());

create policy "read messages" on public.messages for select to authenticated
  using (public.can_access_chat(chat_id));
create policy "send messages" on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.can_access_chat(chat_id));
create policy "delete own messages" on public.messages for delete to authenticated
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Live chat: stream new messages to connected clients (respects RLS)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Image storage: public-read bucket; each PAX uploads into their own folder
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy "upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
