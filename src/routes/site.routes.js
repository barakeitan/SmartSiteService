const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');

 /**
  * @swagger
  * tags:
  *   name: Site
  *   description: The sites managing API
  */

 /**
 * @swagger
 * /api/site:
 *   get:
 *     summary: Returns the list of all the sites
 *     tags: [Site]
 *     responses:
 *       200:
 *         description: The list of the sites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Site'
 */
router.get('/',siteController.getAllSites);

module.exports = router;