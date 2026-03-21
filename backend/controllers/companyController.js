const { setCache, getCache } = require('../services/redis');

const searchCompanies = async (req, res) => {
    try {
        const { company_name } = req.body;

        if (!company_name) {
            return res.status(400).json({ detail: 'Company name is required' });
        }

        // Check Redis cache first
        const cacheKey = `company:${company_name.toLowerCase().trim()}`;
        const cachedResult = await getCache(cacheKey);
        if (cachedResult) {
            console.log(`Cache hit for company: ${company_name}`);
            return res.json(cachedResult);
        }

        // Generate domain guesses based on company name
        const sanitizedName = company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const companies = [];

        // Primary suggestion - most likely domain
        companies.push({
            name: company_name,
            domain: `${sanitizedName}.com`,
            logo_url: `https://logo.clearbit.com/${sanitizedName}.com`,
            description: company_name
        });

        // Add alternative if name has multiple words
        const words = company_name.toLowerCase().split(/\s+/);
        if (words.length > 1) {
            const abbreviation = words.map(w => w[0]).join('');
            companies.push({
                name: company_name,
                domain: `${abbreviation}.com`,
                logo_url: `https://logo.clearbit.com/${abbreviation}.com`,
                description: `${company_name} (abbreviated)`
            });
        }

        // Known company mappings for common names
        const knownCompanies = {
            'google': { domain: 'google.com', name: 'Google' },
            'meta': { domain: 'meta.com', name: 'Meta Platforms' },
            'facebook': { domain: 'facebook.com', name: 'Meta (Facebook)' },
            'amazon': { domain: 'amazon.com', name: 'Amazon' },
            'apple': { domain: 'apple.com', name: 'Apple' },
            'microsoft': { domain: 'microsoft.com', name: 'Microsoft' },
            'netflix': { domain: 'netflix.com', name: 'Netflix' },
            'stripe': { domain: 'stripe.com', name: 'Stripe' },
            'uber': { domain: 'uber.com', name: 'Uber' },
            'airbnb': { domain: 'airbnb.com', name: 'Airbnb' },
            'spotify': { domain: 'spotify.com', name: 'Spotify' },
            'twitter': { domain: 'twitter.com', name: 'X (Twitter)' },
            'x': { domain: 'x.com', name: 'X (Twitter)' },
            'linkedin': { domain: 'linkedin.com', name: 'LinkedIn' },
            'salesforce': { domain: 'salesforce.com', name: 'Salesforce' },
            'oracle': { domain: 'oracle.com', name: 'Oracle' },
            'ibm': { domain: 'ibm.com', name: 'IBM' },
            'intel': { domain: 'intel.com', name: 'Intel' },
            'nvidia': { domain: 'nvidia.com', name: 'NVIDIA' },
            'adobe': { domain: 'adobe.com', name: 'Adobe' },
            'shopify': { domain: 'shopify.com', name: 'Shopify' },
            'zoom': { domain: 'zoom.us', name: 'Zoom' },
            'slack': { domain: 'slack.com', name: 'Slack' },
            'dropbox': { domain: 'dropbox.com', name: 'Dropbox' },
            'github': { domain: 'github.com', name: 'GitHub' },
            'gitlab': { domain: 'gitlab.com', name: 'GitLab' },
            'atlassian': { domain: 'atlassian.com', name: 'Atlassian' },
            'tcs': { domain: 'tcs.com', name: 'Tata Consultancy Services' },
            'infosys': { domain: 'infosys.com', name: 'Infosys' },
            'wipro': { domain: 'wipro.com', name: 'Wipro' },
            'cognizant': { domain: 'cognizant.com', name: 'Cognizant' },
            'accenture': { domain: 'accenture.com', name: 'Accenture' },
            'deloitte': { domain: 'deloitte.com', name: 'Deloitte' },
            'pwc': { domain: 'pwc.com', name: 'PwC' },
            'kpmg': { domain: 'kpmg.com', name: 'KPMG' },
            'ey': { domain: 'ey.com', name: 'Ernst & Young' },
            'mckinsey': { domain: 'mckinsey.com', name: 'McKinsey & Company' },
            'bcg': { domain: 'bcg.com', name: 'Boston Consulting Group' },
            'bain': { domain: 'bain.com', name: 'Bain & Company' }
        };

        const lowerName = company_name.toLowerCase().trim();
        if (knownCompanies[lowerName]) {
            const known = knownCompanies[lowerName];
            companies[0] = {
                name: known.name,
                domain: known.domain,
                logo_url: `https://logo.clearbit.com/${known.domain}`,
                description: known.name
            };
        }

        // Return only unique companies (by domain)
        const uniqueCompanies = companies.filter((company, index, self) =>
            index === self.findIndex(c => c.domain === company.domain)
        );

        const result = uniqueCompanies.slice(0, 3);

        // Cache the result for 1 hour (3600 seconds)
        await setCache(cacheKey, result, 3600);
        console.log(`Cached company search: ${company_name}`);

        res.json(result);
    } catch (error) {
        console.error('Company search error:', error);
        const sanitizedName = req.body.company_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company';
        res.json([{
            name: req.body.company_name || 'Company',
            domain: `${sanitizedName}.com`,
            logo_url: `https://logo.clearbit.com/${sanitizedName}.com`,
            description: req.body.company_name || 'Company'
        }]);
    }
};

module.exports = {
    searchCompanies
};
