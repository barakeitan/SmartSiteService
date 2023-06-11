const Site = require('../models/site.model');

exports.getAllSites = async (req, res) => {
    try {
        const sites = await Site.find({}).exec();
        res.status(200).json(sites);
    } catch (error) {
        console.log(error);
    }
}