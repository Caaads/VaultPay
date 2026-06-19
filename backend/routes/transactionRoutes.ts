import { Router } from 'express';
import { sendTransaction, getTransactions, getAuditLogs } from '../controllers/transactionController.js';

const router = Router();

// Endpoint for sending secure transactional card payloads
router.post('/send', sendTransaction);

// Endpoint for viewing the tokenized ledger (strictly returns tokenized profiles, never credit cards)
router.get('/', getTransactions);

// Endpoint to retrieve active security metrics and live compliance telemetry logs
router.get('/audit-logs', getAuditLogs);

export default router;
