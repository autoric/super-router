'use strict';

const _ = require('lodash');
const Q = require('q');

class ContentNegotiation {

  static request(opts) {
    const request = opts.request;

    if (_isMultipart(request)) {
      return;
    }

    const deferred = Q.defer();
    let newBody = null;
    request.body.on('data', (chunk) => {
      try {
        newBody = JSON.parse(chunk);
      }
      catch (e) {
        deferred.reject(new Error( 'failed to parse json in request'));
      }
    });

    request.body.on('end', () => {
      request.body = newBody;
      deferred.resolve();
    });

    return deferred.promise;
  }

  static response(opts) {
    const response = opts.response;

    response.setHeader('content-type', 'application/json');
    return response.setBody(JSON.stringify(response.getBody()));
  }

}

function _isMultipart(request) {
  const contentType = request.getHeader['Transfer-Encoding'];
  if (contentType && contentType.toLowerCase().indexOf('chunked') > -1) {
    return true;
  }

  return false;
}

module.exports = ContentNegotiation;
