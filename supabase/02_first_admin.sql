-- Run AFTER 01_setup.sql and after creating your own user in Supabase Auth.
-- Replace the email below. No passwords belong in SQL or source control.
-- Safe to rerun for the same first owner; refuses an ambiguous or missing user.
do $$
declare owner_id uuid;
begin
 select id into owner_id from auth.users where lower(email)=lower('REPLACE_WITH_YOUR_EMAIL');
 if owner_id is null then raise exception 'Create the user in Authentication > Users, then replace the email in this script.'; end if;
 update public.profiles set role='super_admin',location_id=null where user_id=owner_id;
 if not found then raise exception 'Profile missing: run 01_setup.sql first.'; end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id)
 values(owner_id,'bootstrap_super_admin','profiles',owner_id::text);
end $$;
