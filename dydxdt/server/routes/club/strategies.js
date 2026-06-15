const router = require('express').Router();
const ctrl   = require('../../controllers/club/strategyListingController');

// All routes already protected by parent router's protect middleware
// (added in existing routes/club/index.js)

router.get('/categories',  ctrl.getCategories);
router.get('/my',          ctrl.getMyStrategies);
router.get('/',            ctrl.getStrategies);
router.get('/:id',         ctrl.getStrategy);
router.post('/',           ctrl.createStrategy);
router.put('/:id',         ctrl.updateStrategy);
router.delete('/:id',      ctrl.deleteStrategy);
router.post('/:id/like',   ctrl.toggleLike);
router.post('/:id/save',   ctrl.toggleSave);

module.exports = router;
