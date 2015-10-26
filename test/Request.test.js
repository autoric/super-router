'use strict';
const chai              = require('chai');
const sinon             = require('sinon');
const sinonChai         = require('sinon-chai');
const sinonStubPromises = require('sinon-promises');
const chaiAsPromised    = require('chai-as-promised');
const _                 = require('lodash');

sinonStubPromises(sinon);
chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

const Request = require('./..').Request;
let request;

describe('Request', () => {

  describe('constructor', () => {
    const OPTIONS_ERROR = 'options must be an object.';
    const HEADERS_ERROR = 'headers must be an object.';
    const PATH_ERROR    = 'path must be a string.';
    const METHOD_ERROR  = 'method must be a valid method string.';
    const BODY_ERROR    = 'body must be a readable stream.';

    it('should throw if options is undefined', () => {
      expect(() => {
        new Request();
      }).to.throw(OPTIONS_ERROR);
    });

    it('should throw if options is not an object', () => {
      expect(() => {
        new Request('asdf');
      }).to.throw(OPTIONS_ERROR);
    });

    it('should not throw if options.headers is undefined', () => {
      expect(() => {
        new Request({});
      }).to.not.throw(HEADERS_ERROR);
    });

    it('should throw if options.headers is defined and not an object', () => {
      expect(() => {
        new Request({ headers : 'asdf' });
      }).to.throw(HEADERS_ERROR);
    });

    it('should throw if options.path is undefined', () => {
      expect(() => {
        new Request({ headers : {} });
      }).to.throw(PATH_ERROR);
    });

    it('should throw if options.path is not a string', () => {
      expect(() => {
        new Request({ headers : {}, path : 7 });
      }).to.throw(PATH_ERROR);
    });

    it('should throw if options.method is undefined', () => {
      expect(() => {
        new Request({ headers : {}, path : '/' });
      }).to.throw(METHOD_ERROR);
    });

    it('should throw if options.method is not a string', () => {
      expect(() => {
        new Request({ headers : {}, path : '/', method : 7 });
      }).to.throw(METHOD_ERROR);
    });

    it('should throw if options.method is not an allowed method value', () => {
      expect(() => {
        new Request({ headers : {}, path : '/', method : 'heart!' });
      }).to.throw(METHOD_ERROR);
    });

    it('should not throw if options.body is undefined', () => {
      expect(() => {
        new Request({ headers : {}, path : '/', method : 'get' });
      }).to.not.throw();
    });

    it('should throw if options.body is defined but not a readable stream', () => {
      expect(() => {
        new Request({ headers : {}, path : '/', method : 'get', body : 'asdf' });
      }).to.throw(BODY_ERROR);
    });

    it('should allow arbitrary properties from constructor', () => {
      const request = new Request({ headers : {}, path : '/', method : 'get', a : 1 });
      expect(request.a).to.equal(1);
    });

    it('should allow construction from an existing request instance', () => {
      const req1 = new Request({ headers : { b : 2 }, path : '/', method : 'get', a : 1 });
      const req2 = new Request(req1);

      expect(req2.headers).to.eql({ b : 2 });
      expect(req2.path).to.equal('/');
      expect(req2.method).to.equal('get');
      expect(req2.a).to.equal(1);
    });
  });

  describe('properties', () => {
    beforeEach(() => {
      request = new Request({
        headers : { hello : 'world' },
        path    : '/',
        method  : 'get'
      });
    });

    it('should set properties based on constructed values', () => {
      expect(request.getHeader('hello')).to.equal('world');
      expect(request.path).to.equal('/');
      expect(request.method).to.equal('get');
    });

    it('should defensively copy to protect itself from upstream changes on the headers object', () => {
      const headers = {};
      request       = new Request({
        headers : headers,
        path    : '/',
        method  : 'get'
      });

      headers.a = 1;

      expect(request.getHeader('a')).to.eql(undefined);
    });

    it('should throw if an invalid path is set', () => {
      expect(() => {
        request.path = 7;
      }).to.throw('path must be a string.');
    });

    it('should normalize path when set', () => {
      request.path = '/WoNkY/';
      expect(request.path).to.equal('/wonky');
    });

    it('should throw if an invalid method is set', () => {
      expect(() => {
        request.method = 'adsf';
      }).to.throw('method must be a valid method string.');
    });

    it('should normalize method when set', () => {
      request.method = 'GET';
      expect(request.method).to.equal('get');
    });

    it('should expose an originalPath property', () => {
      expect(request.originalPath).to.exist;
    });

    it('should throw on assignment to originalPath', () => {
      expect(() => {
        request.originalPath = '/asdf';
      }).to.throw('Cannot set property');
    });

    it('should initialize originalPath to the value of path', () => {
      expect(request.originalPath).to.equal('/');
    });

    it('should initialize originalPath to the input originalPath, if provided', () => {
      request.path = '/a/b/c';
      const newReq = new Request(request);
      expect(newReq.originalPath).to.equal('/');
    });

    it('should allow the body property to be overwritten', () => {
      request.body = { hello : 'world' };
      expect(request.body).to.eql({ hello : 'world' });
    });

    it('should allow assignment of arbitrary properties', () => {
      request.asdf = {};
      expect(request.asdf).to.eql({});
    });

  });

  describe('streaming body', () => {
    beforeEach(() => {
      request = new Request({ path : '/', method : 'get' });
    });

    it('should be an instance of transform stream', () => {
      expect(request.body).to.be.instanceof(require('stream').Transform);
    });

    it('should be readable and writable', (done) => {
      const PassThrough = require('stream').PassThrough;
      const inStream    = new PassThrough();
      const outStream   = new PassThrough();

      inStream.pipe(request.body).pipe(outStream);

      inStream.end('hello world');
      outStream.on('data', (chunk) => {
        expect(chunk.toString()).to.equal('hello world');
        done();
      });
    });
  });

});
