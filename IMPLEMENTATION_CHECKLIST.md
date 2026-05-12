# Cannes Calendar - Action Items Checklist

This checklist tracks the security and reliability improvements implemented to prevent data deletion bugs.

## ✅ Completed Fixes

- [x] **Firestore Security Rules** - Implemented role-based access control
- [x] **Google Apps Script Error Handling** - Added comprehensive logging and error catching
- [x] **Audit Logging** - Track all booking changes with user and timestamp
- [x] **Error Recovery** - Revert optimistic updates on Firebase errors
- [x] **Documentation** - Created implementation guide

## 📋 Next Steps - Required

### 1. Deploy Firestore Rules (CRITICAL)
```bash
cd cannes-calendar-repo
firebase deploy --only firestore:rules
```
**Status:** ⬜ Not Started  
**Responsible:** [Your Name]  
**Timeline:** Immediate

### 2. Update Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Open your "Cannes Calendar" project
3. Copy entire content from `scripts/email_notification_script.gs`
4. Paste into `Code.gs` (replacing existing code)
5. Click **Deploy** → **New Deployment** → **API executable**

**Status:** ⬜ Not Started  
**Responsible:** [Your Name]  
**Timeline:** Within 24 hours of rule deployment

### 3. Deploy Updated Application Code
```bash
cd cannes-calendar-repo
npm run build
firebase deploy --only hosting
```
**Status:** ⬜ Not Started  
**Responsible:** [Your Name]  
**Timeline:** Within 24 hours of rule deployment

### 4. Enable Automated Firestore Backups
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your "cannes-house" project
3. Navigate to **Firestore** → **Backups**
4. Click **Create Schedule**
5. Set:
   - **Database**: (default)
   - **Recurrence**: Daily
   - **Retention**: 30 days
   - **Location**: Same as database

**Status:** ⬜ Not Started  
**Responsible:** [Your Name]  
**Timeline:** Within 48 hours

## 📋 Next Steps - Recommended

### 5. Set Up Monitoring Alerts
- [ ] Configure Cloud Monitoring for Firestore quota usage
- [ ] Set up email alerts for script failures
- [ ] Create dashboard for audit log activity

### 6. Test Disaster Recovery
- [ ] Verify backup restore process works
- [ ] Document recovery time objective (RTO)
- [ ] Practice manual restore to staging environment

### 7. User Communication
- [ ] Inform users about the fixes
- [ ] Document new audit logging features
- [ ] Explain role-based access restrictions

### 8. Performance Monitoring
- [ ] Monitor script execution time (should be < 30 sec)
- [ ] Track Firestore write operations
- [ ] Monitor audit log growth

## 🔍 Verification Checklist

After deployment, verify each fix:

### Firestore Rules Verification
- [ ] Non-admin user cannot delete bookings
- [ ] Non-admin user CAN create/toggle their own bookings
- [ ] Admin user can modify all bookings
- [ ] All users can read bookings
- [ ] Service account (script) can delete mail_queue items

**Test Commands:**
```bash
firebase rules:test --service-account=path/to/service-account-key.json
```

### Audit Logging Verification
- [ ] Audit logs appear in Firestore after making a booking change
- [ ] Audit logs contain correct user email and timestamp
- [ ] Audit logs track added/removed dates correctly

**Check in Firebase Console:**
- Firestore → Collections → audit_log
- Should see documents created after making changes

### Script Error Handling Verification
- [ ] Run script manually (Google Apps Script → select `sendDailyDigest` → Run)
- [ ] Check execution logs for "Deletion Summary"
- [ ] Verify successful deletion count matches items processed

**Check in Google Apps Script:**
- Executions tab → Look for recent runs
- Should see logs like: "Deletion Summary - Success: 3, Failed: 0"

### Backup Verification
- [ ] Backup schedule created and active
- [ ] First backup completes successfully
- [ ] Can access backups in Cloud Console

**Check in Google Cloud Console:**
- Firestore → Backups
- Should see your scheduled backup running

## 📊 Metrics to Track

After implementation, monitor these metrics:

| Metric | Current | Target | Checked |
|--------|---------|--------|---------|
| Script execution failures per week | ? | 0 | ⬜ |
| Audit logs created per day | ? | 5-20 | ⬜ |
| Backup completion success rate | ? | 100% | ⬜ |
| Data loss incidents | ? | 0 | ⬜ |
| Permission denied errors | ? | 0 | ⬜ |

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Rule Issues**: Revert firestore.rules to permissive rules (temporary):
   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Script Issues**: Disable the trigger in Google Apps Script temporarily

3. **Code Issues**: Revert to previous hosting deployment:
   ```bash
   firebase hosting:rollback
   ```

4. **Data Loss**: Restore from backup:
   ```bash
   gcloud firestore import gs://your-bucket/backups/BACKUP_FOLDER
   ```

## 📞 Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- Google Apps Script Documentation: https://developers.google.com/apps-script
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/start
- Cloud Backups: https://cloud.google.com/firestore/docs/manage-data/export-import

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Admin | | | |
| Deployment Lead | | | |

---

**Last Updated:** 2026-05-12  
**Version:** 1.0  
**Status:** Ready for Implementation
