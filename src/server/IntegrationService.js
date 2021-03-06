//Contain all our methods for the application ie. get bundles.. get resources etc .

const axios = require('axios');
//Possible query for contents.. would have to then check on the client
//select id, Format , Source,  FilePath, LightningComponentBundle.DeveloperName from LightningComponentResource where ManageableState in ('unmanaged') and format in ('js', 'html') and (NOT FilePath like '%.js-meta.xml')
const LIGHTNING_WEB_COMPONENT_QUERY = `SELECT ID, DeveloperName,ManageableState,ApiVersion from #SOBJECT# order by developername asc`;
const VERSION_API = '49.0';
// eslint-disable-next-line inclusive-language/use-inclusive-words
//good example -https://github.com/adityanaag3/lwc-oss-oauth/blob/master/src/server/integrationService.js
module.exports = class IntegrationService {
    constructor(logger, authService) {
        this.logger = logger;
        this.authService = authService;
    }
    _performGet(urlOptions) {
        //using https://github.com/axios/axios#features
        return new Promise((resolve, reject) => {
            axios
                .request(urlOptions)
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    getLightningComponentBundles(req, res) {
        //https://tomwoodhousegs0-dev-ed.my.salesforce.com/
        ///services/data/v49.0/tooling/query?q=SELECT+ID,+DeveloperName+from+LightningComponentBundle+order+by+lastmodifieddate+desc
        let queryTerm = req.query.q;
        let SObject =
            req.query.type === 'auraComps'
                ? 'AuraDefinitionBundle'
                : 'LightningComponentBundle';
        let query = !queryTerm
            ? LIGHTNING_WEB_COMPONENT_QUERY.replace('#SOBJECT#', SObject)
            : `SELECT ID, DeveloperName,ManageableState,ApiVersion from ${SObject} where DeveloperName like '%${queryTerm}%' order by developername asc`;
        let session = this.authService.getSession(req, res);
        if (session === null) {
            res.status(401).send('Unauthorized');
            return;
        }

        let options = {
            url: `/services/data/v${VERSION_API}/tooling/query`,
            baseURL: session.sfdcInstanceUrl,
            method: 'get',
            params: {
                q: query
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + session.sfdcAccessToken
            }
        };
        this._performGet(options)
            .then((response) => {
                const formattedData = response.data.records.map(
                    (componentBundle, idx) => {
                        return {
                            id: componentBundle.Id,
                            label: componentBundle.DeveloperName,
                            name: idx, //will use this to get the bundle info for items
                            href: `#${componentBundle.DeveloperName}`,
                            items: [],
                            expanded: false,
                            ManageableState: componentBundle.ManageableState,
                            IsExposed:
                                componentBundle.ManageableState === 'installed'
                                    ? false
                                    : true,
                            ApiVersion: componentBundle.ApiVersion
                        };
                    }
                );
                res.json({ data: formattedData });
            })
            .catch((error) => {
                res.status(500).send(error);
            });
    }

    getLightningComponent(req, res) {
        let bundleId = req.params.id;
        let query = bundleId.includes('0Rb')
            ? `select id, Source,  FilePath,Format , LightningComponentBundle.DeveloperName from LightningComponentResource where LightningComponentBundleId = '${bundleId}' `
            : `select Id, IsDeleted, ManageableState, AuraDefinitionBundleId, AuraDefinitionBundle.DeveloperName , Format, Source, DefType from AuraDefinition where AuraDefinitionBundleId = '${bundleId}' `;
        //query the contents of the bundle
        //https://tomwoodhousegs0-dev-ed.my.salesforce.com/
        ///services/data/v49.0/tooling/query?q=SELECT+ID,+DeveloperName+from+LightningComponentBundle+order+by+lastmodifieddate+desc
        let session = this.authService.getSession(req, res);

        if (session === null) {
            res.status(401).send('Unauthorized');
            return;
        }

        let options = {
            url: `/services/data/v${VERSION_API}/tooling/query`,
            baseURL: session.sfdcInstanceUrl,
            method: 'get',
            params: {
                q: query
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + session.sfdcAccessToken
            }
        };
        this._performGet(options)
            .then((response) => {
                const formattedData = response.data.records.map((component) => {
                    return {
                        id: component.Id,
                        Source: component.Source,
                        name: component.Id,
                        href: `#${component.FilePath}`,
                        expanded: true,
                        items: [],
                        label: component.FilePath
                            ? component.FilePath
                            : component.DefType, //null for aura use defType
                        attributes: component.attributes,
                        Format: component.Format,
                        Type: component.LightningComponentBundle
                            ? 'LWC'
                            : 'AURA',
                        ComponentName: component.LightningComponentBundle
                            ? component.LightningComponentBundle.DeveloperName
                            : component.AuraDefinitionBundle.DeveloperName //null for aura use. DeveloperName
                    };
                });
                res.json({ data: formattedData });
            })
            .catch((error) => {
                res.status(500).send(error);
            });
    }
};
