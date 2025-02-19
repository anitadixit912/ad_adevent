import chai from 'chai'
import chaiHttp from 'chai-http'

chai.use(chaiHttp);
chai.should();
var expect = chai.expect;

import config from "./testscripts/util/config.js"
let xsuaa_access_token;
let ExternalID;

describe("Get Access Token from XSUAA", () => {
	it("should fetch bearer token", async () => {
		let requestHeaders = {
			'Content-Type': 'application/x-www-form-urlencoded'
		};

		try {
			const response = await chai.request(config.token_url)
				.post("/oauth/token")
				.set(requestHeaders)
				.send(config.xsuaa)

			expect(response).to.be.a("Object");
			xsuaa_access_token = response.body.access_token;
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
});

describe("Read notifications from the database", () => {
	it("Should load from database", async () => {
		try {
			const response = await chai.request(config.service_domain)
				.get("api/v1/Notifications")
				.set('Authorization', 'bearer ' + xsuaa_access_token)

			expect(response.status).to.equal(200);
// 			expect(response.text).to.includes('Simon Rampal');
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
});

describe("Push message to event queue", () => {
	it("Should push message to event queue", async () => {

		const body = {
			"businessUnit": 'Products',
			"country": 'AUS',
			"department": 'Engineering AU',
			"email": 'Simon.Rampal@bestrunsap.com',
			"jobTitle": 'Engineering Intern',
			"locationCode": '8510-0001',
			"locationDesc": 'Sydney',
			"name": 'Testing name',
			"reason": 'LOC_CHG',
			"userId": '106003'
		};

		try {
			const response = await chai.request(config.user_provided_uri)
				.post('/Topic/emp/transfer/8510-0001')
				.auth(config.user_provided_username, config.user_provided_password)
				.send(body)
			expect(response.status).to.equal(200);
		} catch (err) {
			console.error(err);
			throw err;
		}
	});

	it("Should load all the notifications from database", async () => {
		try {
			const response = await chai.request(config.service_domain)
				.get("api/v1/Notifications")
				.set('Authorization', 'bearer ' + xsuaa_access_token)

			expect(response.status).to.equal(200);
			expect(response.text).to.includes('Testing name');
			const parsedData = JSON.parse(response.text);
			parsedData.Notifications.filter(row => {
				if (row.EMPNAME === 'Testing name') {
					ExternalID = row.EXTERNALID;
					return;
				}
			});
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
});

describe("Update Notifications workstation", () => {
	it("Update workstation using external ID", async () => {
		let headers = {
			"Content-Type": "application/json",
			"Authorization": "bearer " + xsuaa_access_token
		};

		try {
			const response = await chai.request(config.service_domain)
				.post(`api/v1/Notifications/${ExternalID}/workstation`)
				.send({
					"WRKBUILDING": "test-workbuilding",
					"WRKFLOOR": "test-workfloor",
					"WRKSTATION": "test-workstation",
				})
				.set(headers)

			expect(response.status).to.equal(204);
		} catch (err) {
			console.error(err);
			throw err;
		}
	});

	it("should return the updated notification", async () => {
		try {
			const response = await chai.request(config.service_domain)
				.get("api/v1/Notifications")
				.set('Authorization', 'bearer ' + xsuaa_access_token)

			expect(response.status).to.equal(200);
			expect(response.text).to.includes('test-workbuilding');
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
});
