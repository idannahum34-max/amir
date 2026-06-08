# Premium platform fix

תיקונים בגרסה הזו:

- פתיחת פרימיום נבדקת גם לפי `users.premium=true` וגם לפי `subscriptionStatus=active/trial`.
- ה־Dashboard לא אמור להציג “ניסיון חינמי” למשתמש פרימיום.
- Practice / Exam / Vocabulary לא אמורים להיתקע על טעינה אינסופית; יש מסך שגיאה/ריק במקום spinner אינסופי.
- Webhook של Lemon כבר לא מתעלם מ־userId שאינו מספרי.
- Webhook לא נחסם אם טבלת `subscriptions` או `payments` לא תואמת userId — הוא עדיין מעדכן את `users.premium`.
- יצירת ניסיון/מבחן ב־Postgres משתמשת ב־`.returning()` במקום `insertId` של MySQL.

אחרי העלאה והרצה ב־Vercel, אם אין תוכן בפרימיום:

```bash
npm run db:push
npm run db:seed
```

או להריץ את `SUPABASE_PREMIUM_GATE_SCHEMA.sql` ב־Supabase SQL Editor אם חסרות עמודות פרימיום.
