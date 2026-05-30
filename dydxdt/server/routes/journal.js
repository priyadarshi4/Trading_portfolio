const router = require('express').Router();
const { getEntries, createEntry, getEntry, updateEntry, deleteEntry } = require('../controllers/journalController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').get(getEntry).put(updateEntry).delete(deleteEntry);
module.exports = router;
