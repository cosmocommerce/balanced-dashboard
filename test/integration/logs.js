module('Logs', {
	setup: function() {
		Testing.setupMarketplace();
		Testing.createDebits();
		Testing.setupLogs();
	},
	teardown: function() {}
});

test('can visit page', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, 'get');

	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.then(function() {
			var $title = $('#content h1');
			var logRequest = spy.getCall(spy.callCount - 1);
			assert.equal(logRequest.args[0], Balanced.Log);
			assert.equal(logRequest.args[1], '/logs?limit=2&method%5Bin%5D=post%2Cput%2Cdelete&offset=0&q=&sort=created_at%2Cdesc');
			assert.notEqual($title.text().indexOf('Logs'), -1, 'Title is correct');
		});
});

test('has logs in table', function(assert) {
	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.then(function() {
			assert.equal($('table.logs tbody tr').length, 2, 'has 2 logs');
		})
		.click('table.logs tfoot tr a')
		.then(function() {
			assert.equal($('table.logs tbody tr').length, 4, 'has 4 logs');
			assert.equal($('table.logs tfoot td').length, 1, 'has "load more"');
		});
});

test('filter logs by endpoint bank accounts', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, 'get');

	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.then(function() {
			assert.equal($('table.logs tbody tr').length, 2, 'has 2 logs');
		})
		.click('.results div.filter-endpoints ul a.bank_accounts')
		.then(function() {
			assert.ok(spy.calledWith(Balanced.Log, '/logs?limit=2&method%5Bin%5D=post%2Cput%2Cdelete&offset=0&q=&sort=created_at%2Cdesc'));
			assert.equal($('table.logs tbody tr').length, 1, 'has 1 log');
		});
});

test('filter logs by datetime range', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, 'get');

	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.waitFor(function() {
			return $('table.logs tfoot td').length >= 1;
		}, 'has "load more"')
		.then(function() {
			assert.equal($('table.logs tbody tr').length, 2, 'has 2 logs');
		})
		.click('.results .timing a.dropdown-toggle')
		.then(function() {
			$('.results .timing input[name="after"]').val('08/01/2013').trigger('keyup');
		})
		.click('.results .timing td.active.day')
		.then(function() {
			$('.results .timing input[name="before"]').val('08/01/2013').trigger('keyup');
		})
		.click('.results .timing td.active.day')
		.click('.results button.go')
		.then(function() {
			// Notice: month 7 is Aug here for JS Date, ugly javascript...
			// As the date time is local, we need to convert it to ISO from in UTC timezone
			var begin = new Date(2013, 7, 1);
			var begin_iso = encodeURIComponent(begin.toISOString());
			var end = new Date(2013, 7, 2);
			var end_iso = encodeURIComponent(end.toISOString());

			var expected_uri = '/logs?' +
				'created_at%5B%3C%5D=' + end_iso + '&' +
				'created_at%5B%3E%5D=' + begin_iso + '&' +
				'limit=2&method%5Bin%5D=post%2Cput%2Cdelete&offset=0&q=&sort=created_at%2Cdesc';

			var request = spy.getCall(spy.callCount - 1);
			assert.ok(spy.callCount, 2);
			assert.equal(request.args[0], Balanced.Log);
			assert.equal(request.args[1], expected_uri);
		});
});


test('filter logs by request failed only', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, 'get');

	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.then(function() {
			assert.equal($('table.logs tbody tr').length, 2, 'has 2 logs');
		})
		.click('.results .filter-status-rollup label.succeeded input[type="checkbox"]')
		.then(function() {
			assert.ok(spy.calledWith(Balanced.Log,
				'/logs?limit=2&method%5Bin%5D=post%2Cput%2Cdelete&offset=0&q=&sort=created_at%2Cdesc&status_rollup%5Bin%5D=3xx%2C4xx%2C5xx'));

			assert.equal($('table.logs tbody tr').length, 1, 'has no failures');
			assert.equal($('table.logs tfoot td').length, 0, 'no "load more"');

			// check the first row is the log we expect
			assert.equal($('table.logs tbody tr td').first().text().trim(), 'No results');
		});
});

test('view a particular log entry', function(assert) {
	visit(Testing.LOGS_ROUTE)
		.click('#marketplace-nav i.icon-logs')
		.click('table.logs tbody tr:first-of-type a')
		.then(function() {
			assert.equal($('h1.page-title').text(), 'POST /customers/' + Testing.CUSTOMER_ID + '/debits', 'h1 title is correct');
			assert.equal($('dd[data-property="request-id"]').text().length, 35, 'Log request id valid');
		});
});
