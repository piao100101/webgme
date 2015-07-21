/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator from webgme on Wed Jul 15 2015 15:24:02 GMT-0500 (CDT).
 */

define([
    'plugin/PluginConfig',
    'plugin/PluginBase',
    'common/core/users/merge',
    'q',
    'common/regexp'
], function (PluginConfig, PluginBase, merge, Q, REGEXP) {
    'use strict';

    /**
     * Initializes a new instance of MergeExample.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin MergeExample.
     * @constructor
     */
    var MergeExample = function () {
        // Call base class' constructor.
        PluginBase.call(this);
    };

    // Prototypal inheritance from PluginBase.
    MergeExample.prototype = Object.create(PluginBase.prototype);
    MergeExample.prototype.constructor = MergeExample;

    /**
     * Gets the name of the MergeExample.
     * @returns {string} The name of the plugin.
     * @public
     */
    MergeExample.prototype.getName = function () {
        return 'Merge Example';
    };

    /**
     * Gets the semantic version (semver.org) of the MergeExample.
     * @returns {string} The version of the plugin.
     * @public
     */
    MergeExample.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * Gets the description of the MergeExample.
     * @returns {string} The description of the plugin.
     * @public
     */
    MergeExample.prototype.getDescription = function () {
        return 'Example plugin to show how to use the merge capabilities of webgme.';
    };

    /**
     * Gets the configuration structure for the MergeExample.
     * The ConfigurationStructure defines the configuration for the plugin
     * and will be used to populate the GUI when invoking the plugin from webGME.
     * @returns {object} The version of the plugin.
     * @public
     */
    MergeExample.prototype.getConfigStructure = function () {
        return [
            {
                'name': 'mergeFrom',
                'displayName': 'Merge from',
                //'regex': '^[a-zA-Z]+$', // TODO: verify branch or hash
                //'regexMessage': 'Name can only contain English characters!',
                'description': 'Merging changes from this branch or commit hash.',
                'value': 'development',
                'valueType': 'string',
                'readOnly': false
            },
            {
                'name': 'mergeTo',
                'displayName': 'Merge to',
                //'regex': '^[a-zA-Z]+$', // TODO: verify branch or hash
                //'regexMessage': 'Name can only contain English characters!',
                'description': 'Merging changes to this branch or commit hash.',
                'value': 'master',
                'valueType': 'string',
                'readOnly': false
            },
            {
                'name': 'createNewBranch',
                'displayName': 'Create a new branch for target',
                //'regex': '^[a-zA-Z]+$', // TODO: verify branch or hash
                //'regexMessage': 'Name can only contain English characters!',
                'description': 'Creates a new branch for "to" first then merges changes "from"',
                'value': false,
                'valueType': 'boolean',
                'readOnly': false
            },
            {
                'name': 'newBranchName',
                'displayName': 'Name of the new branch',
                'regex': '^[a-zA-Z]+$', // TODO: verify branch or hash
                'regexMessage': 'Name can only contain English characters!',
                'description': 'Name of the new branch where the result of the merge will be stored.',
                'value': 'merge',
                'valueType': 'string',
                'readOnly': false
            }

        ];
    };


    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    MergeExample.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            mergeTo,
            prepareTarget = function () {
                var deferred = Q.defer(),
                    getCommitHash = function (commitOrBranch) {
                        var commitDeferred = Q.defer();

                        if (REGEXP.HASH.test(commitOrBranch)) {
                            commitDeferred.resolve(commitOrBranch);
                        } else {
                            Q.ninvoke(self.project, 'getBranches')
                                .then(function (branches) {
                                    commitDeferred.resolve(branches[commitOrBranch]);
                                })
                                .catch(commitDeferred.reject);
                        }
                        return commitDeferred.promise;
                    };

                if (currentConfig.createNewBranch === true) {
                    getCommitHash(currentConfig.mergeTo)
                        .then(function (commitHash) {
                            return Q.ninvoke(self.project, 'createBranch', currentConfig.newBranchName, commitHash);
                        })
                        .then(function () {
                            deferred.resolve(currentConfig.newBranchName);
                        })
                        .catch(deferred.reject);
                } else {
                    deferred.resolve(currentConfig.mergeTo);
                }
                return deferred.promise;
            };

        // Obtain the current user configuration.
        var currentConfig = self.getCurrentConfig();
        self.logger.info('Current configuration ' + JSON.stringify(currentConfig, null, 4));

        //FIXME running on client side will not generate events, so need manual update of the UI afterwards
        prepareTarget()
            .then(function (mergeTo__) {
                mergeTo = mergeTo__;
                return merge.merge({
                    project: self.project,
                    logger: self.logger,
                    gmeConfig: self.gmeConfig,
                    myBranchOrCommit: currentConfig.mergeFrom,
                    theirBranchOrCommit: mergeTo,
                    auto: true
                });
            })
            .then(function (result) {
                // result.baseCommitHash
                // result.conflict
                // result.diff
                // result.myCommitHash
                // result.projectId
                // result.targetBranchName
                // result.theirCommitHash

                self.logger.info(result);

                if (result.conflict.items.length === 0) {
                    // FIXME: what if it could not update the branch or got a commit hash
                    return result;
                } else {
                    // there was a conflict
                    // TODO: change conflict object as necessary select theirs or mine for resolution

                    // resolve
                    return merge.resolve({
                        partial: result,
                        project: self.project,
                        logger: self.logger,
                        gmeConfig: self.gmeConfig,
                        myBranchOrCommit: currentConfig.mergeFrom,
                        theirBranchOrCommit: mergeTo,
                        auto: true
                    });
                }

            })
            .then(function (result) {
                // if merged without any conflicts the result structure is
                // result.baseCommitHash
                // result.conflict
                // result.diff
                // result.myCommitHash
                // result.projectId
                // result.targetBranchName
                // result.theirCommitHash

                // if resolved the result structure as follows
                // result.updatedBranch
                // result.hash

                // FIXME: what if it could not update the branch or got a commit hash
                self.logger.info(result);

                self.result.setSuccess(true);
                callback(null, self.result);
            })
            .catch(function (err) {
                self.result.setSuccess(false);
                self.result.setError(err.message);
                callback(err, self.result);
            });
    };

    return MergeExample;
});