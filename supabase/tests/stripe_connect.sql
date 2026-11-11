insert into payments.cook_accounts (cook_id, stripe_account_id, charges_enabled, bissabi_validated)
values
  ('cook_ready', 'acct_ready', true, true),
  ('cook_stripe_only', 'acct_stripe', true, false),
  ('cook_bissabi_only', 'acct_bissabi', false, true);

do $$
begin
  if (select payments_live from payments.settings) then
    raise exception 'payments_live doit être faux';
  end if;
  if (select commission_rate_bps from payments.settings) <> 1000 then
    raise exception 'commission par défaut 10 %%';
  end if;
  if not payments.cook_can_receive('cook_ready') then
    raise exception 'cuisinier prêt refusé';
  end if;
  if payments.cook_can_receive('cook_stripe_only') or payments.cook_can_receive('cook_bissabi_only') then
    raise exception 'cuisinier incomplet accepté';
  end if;
  if not payments.block_live(true) then
    raise exception 'un événement live aurait dû être bloqué';
  end if;
  if payments.block_live(false) then
    raise exception 'un événement test a été bloqué';
  end if;
  if payments.record_webhook('evt_1', 'payment_intent.succeeded', false, 'ord_1', 'paid') <> 'applied' then
    raise exception 'webhook test non appliqué';
  end if;
  if (select status from payments.order_payments where order_id = 'ord_1') <> 'paid' then
    raise exception 'statut non payé';
  end if;
  if payments.record_webhook('evt_1', 'payment_intent.succeeded', false, 'ord_1', 'paid') <> 'duplicate' then
    raise exception 'doublon accepté';
  end if;
  if (select count(*) from payments.webhook_events) <> 1 then
    raise exception 'deuxième ligne de webhook';
  end if;
  if payments.record_webhook('evt_live', 'payment_intent.succeeded', true, 'ord_1', 'paid') <> 'live_blocked' then
    raise exception 'live non bloqué';
  end if;
  if (select status from payments.order_payments where order_id = 'ord_1') <> 'paid' then
    raise exception 'le live a changé le statut';
  end if;
end $$;
