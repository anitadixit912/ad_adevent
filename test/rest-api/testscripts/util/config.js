import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const cred =  require("./appEnv");
const vcap = cred.system_env_json.VCAP_SERVICES;
const appenv = cred.application_env_json.VCAP_APPLICATION;
const user_provided_details = vcap['user-provided'][0].credentials.test;

const {
    uri,
    username,
    password
} = user_provided_details;

const config = {
    "token_url": vcap.xsuaa[0].credentials.url,
    "service_domain": 'https://' + appenv.application_uris[0]+"/",
    "xsuaa": {
        "grant_type": "client_credentials",
        "client_id": vcap.xsuaa[0].credentials.clientid,
        "client_secret": vcap.xsuaa[0].credentials.clientsecret
    },
    "user_provided_uri": uri,
    "user_provided_username": username,
    "user_provided_password": password
}

export default config;
