// strategies.js
const stratRouter = require('express').Router();
const { getStrategies, createStrategy, updateStrategy, deleteStrategy, syncStrategyStats } = require('../controllers/strategiesController');
const { protect } = require('../middleware/auth');
stratRouter.use(protect);
stratRouter.route('/').get(getStrategies).post(createStrategy);
stratRouter.route('/:id').put(updateStrategy).delete(deleteStrategy);
stratRouter.post('/:id/sync', syncStrategyStats);
module.exports = stratRouter;
