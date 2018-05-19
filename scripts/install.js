'use strict';

const async = require('async');
const fs = require('fs-extra');
const _ = require('lodash');
const nunjucks = require('nunjucks');
nunjucks.configure([], {watch: false});
const util = require('./src/util/util');
const debug = require('debug')('formio:error');
const path = require('path');

module.exports = function(formio, items, done) {
  // The project that was created.
  let project = {};

  // The client directory
  const client = path.join(__dirname, 'client');

  // The project template file
  const projectTemplate = formio.config.project.template ? `project.${formio.config.project.template}.json` : 'project.default.json';

  // The root credentials
  const root = {
    email: formio.config.project.root.email || 'admin@example.com',
    password: formio.config.project.root.password || 'admin.123'
  }

  const pkgs = {
    api: path.join(__dirname, 'package.json'),
    client: path.join(__dirname, 'client', 'package.json')
  }

  // All the steps in the installation.
  const steps = {

    /**
     * Extract the client.
     *
     * @param done
     * @returns {*}
     */
    configureClient: function(done) {
      if (!items.configure) {
        return done();
      }

      let templateFile = path.join(__dirname, 'templates', 'config.template.js');
      let directoryPath = client;

      // Get the package json file.
      let info = {
        api: {},
        client: {}
      };
      try {
        info.api = JSON.parse(fs.readFileSync(pkgs.api));
        info.client = JSON.parse(fs.readFileSync(pkgs.client));
      }
      catch (err) {
        debug(err);
        return done(err);
      }

      // Change the document root if we need to.
      if (info.client.formio && info.client.formio.docRoot) {
        directoryPath = path.join(directoryPath, info.client.formio.docRoot);
      }

      // Check that config.template.js exists
      if (!fs.existsSync(templateFile)) {
        templateFile = path.join(directoryPath, 'config.template.js');

        if (!fs.existsSync(templateFile)) {
          return done('Missing config.template.js file');
        }
      }

      // Change the project configuration.
      util.log('Configuring client...'.green);
      const config = fs.readFileSync(templateFile);
      const newConfig = nunjucks.renderString(config.toString(), {
        domain: formio.config.domain || 'https://lvh.me',
        userForm: formio.config.project.userForm || 'user',
        userLoginForm: formio.config.project.userLoginForm || 'user/login'
      });
      fs.writeFileSync(path.join(directoryPath, 'config.js'), newConfig);

      let fast = `API=${info.api.version}\nCLIENT=${info.client.version}\nSCHEMA=${info.api.schema}\nTEMPLATE=${info.api.templateVersion}\n`;
      fs.writeFileSync(path.join(__dirname, '.fast'), fast);

      done();
    },

    /**
     * Import the template.
     * @param done
     */
    importTemplate: function(done) {
      if (!items.import) {
        return done();
      }

      let templateFile = path.join(__dirname, 'templates', projectTemplate);
      let directoryPath = client;

      // Get the package json file.
      let info = {};
      try {
        info = JSON.parse(fs.readFileSync(path.join(directoryPath, 'package.json')));
      }
      catch (err) {
        debug(err);
        return done(err);
      }

      // Change the document root if we need to.
      if (info.formio && info.formio.docRoot) {
        directoryPath = path.join(directoryPath, info.formio.docRoot);
      }

      // Check that config.template.js exists
      if (!fs.existsSync(templateFile)) {
        templateFile = path.join(directoryPath, 'project.json');
        
        if (!fs.existsSync(templateFile)) {
          return done('Missing project.json file'.red);
        }
      }

      let template = {};
      try {
        template = JSON.parse(fs.readFileSync(templateFile));
      }
      catch (err) {
        debug(err);
        return done(err);
      }

      // Get the form.io service.
      util.log('Importing template...'.green);
      const importer = require('./src/templates/import')({formio: formio});
      importer.template(template, function(err, template) {
        if (err) {
          return done(err);
        }

        project = template;
        done(null, template);
      });
    },

    /**
     * Create the root user object.
     *
     * @param done
     */
    createRootUser: function(done) {
      if (!items.user) {
        return done();
      }
      util.log('Creating root user account...'.green);
      util.log('Encrypting password');
      formio.encrypt(root.password, function(err, hash) {
        if (err) {
          return done(err);
        }

        // Create the root user submission.
        util.log(`Creating root user account ${root.email}`);
        formio.resources.submission.model.create({
          form: project.resources.admin._id,
          data: {
            email: root.email,
            password: hash
          },
          roles: [
            project.roles.administrator._id
          ]
        }, function(err, item) {
          if (err) {
            return done(err);
          }

          done();
        });
      });
    }
  };

  util.log('Installing...');
  async.series([
    steps.configureClient,
    steps.importTemplate,
    steps.createRootUser
  ], function(err, result) {
    if (err) {
      util.log(err);
      return done(err);
    }

    util.log('Install successful!'.green);
    done();
  });
};