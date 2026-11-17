-- =============================================================================
-- 0103_help_articles_customer_seed.sql
-- Customer Help & Support FAQ starter content (English only; no translation is invented).
-- Seeded ONLY when help_articles is empty, so an admin's own content is never mixed with it and a
-- re-run is a no-op. Admins can edit, unpublish or replace every row via /admin/help/articles.
-- Plain text, no contact details, no farm or farmer wording (BR-16, BR-82).
-- =============================================================================

-- +migrate Up

INSERT INTO help_articles (category, locale, title, body, sort_order, is_published)
SELECT v.category, 'en', v.title, v.body, v.sort_order, true
  FROM (VALUES
    ('Orders',   'How do I track my order?',
     'Open Orders, pick the order and view its tracking timeline. Status updates as it is confirmed, packed and ready for pickup or delivery.', 10),
    ('Orders',   'Can I cancel or change an order?',
     'An order can be cancelled while it is still pending or confirmed. Once it has been packed it can no longer be changed.', 20),
    ('Payments', 'How do I add money to my wallet?',
     'Open Wallet and choose Top up. Your wallet balance is used first when you check out.', 10),
    ('Payments', 'When will I get a refund?',
     'Approved refunds are credited back to your wallet. You can see the credit in your wallet history.', 20),
    ('Quality',  'What if my produce is not fresh or is damaged?',
     'Raise a support ticket from Help & Support within the return window and attach a photo. Our team will review it and reply in the ticket.', 10),
    ('Account',  'How do I update my profile or address?',
     'Open Profile to edit your name, e-mail and saved addresses.', 10)
  ) AS v (category, title, body, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM help_articles);

-- +migrate Down

DELETE FROM help_articles
 WHERE created_by IS NULL
   AND locale = 'en'
   AND title IN ('How do I track my order?', 'Can I cancel or change an order?',
                 'How do I add money to my wallet?', 'When will I get a refund?',
                 'What if my produce is not fresh or is damaged?', 'How do I update my profile or address?');
