'use strict'

const express = require('express')
const app = express()

var sharedUtils = require('@t23/t23-shared-utils');

// Print environment varitables
function printSecretsInEnvVariables(prefix){
    var response='++ Reading environment variables starting with '+prefix+'\n';
    Object.keys(process.env).forEach(function(key) {
      if (key.startsWith(prefix)){ 
        response+='-- env.'+key+' is '+sharedUtils.truncador(process.env[key])+'\n'; 
      }
    });
    return response;
}

// Print config files
function readConfigFiles(prefix){
    var response='++ Reading files in environment variables starting with '+prefix+'\n';
    Object.keys(process.env).forEach(function(key) {
      if (key.startsWith(prefix)){ 
        var filePath=process.env[key];
        //
        response+='-- env.'+key+' is '+filePath+'\n';
        //
        var fileContent=sharedUtils.readFile(filePath);
        try {
            var data=JSON.parse(fileContent);
            for (const key in data) {
                response+='---- File content is '+ sharedUtils.truncador(key) +' ' + sharedUtils.truncador(data[key]) +'\n';
            }
        } catch (e){
            response+='---- File content is '+ sharedUtils.truncador(fileContent) +'\n';
        }
      }
    });
    return response;
}

// Print config file
function readConfigFile(envVarName){
    var response='++ Reading file in environment variable with name '+envVarName+'\n';
    if(process.env[envVarName]) {
        var filePath=process.env[envVarName];
        //
        response+='-- env.'+envVarName+' is '+filePath+'\n';
        //
        var fileContent=sharedUtils.readFile(filePath);
        try {
            var data=JSON.parse(fileContent);
            for (const key in data) {
                response+='---- File content is '+ sharedUtils.truncador(key) +' ' + sharedUtils.truncador(data[key]) +'\n';
            }
        } catch (e){
            response+='---- File content is not JSON '+ sharedUtils.truncador(fileContent) +'\n';
        }
    };
    return response;
}

// Read secrets from Secret manager using API
function readSecretsFromSM(smConfig){
    //If already retrieved, do not retrrieve them again
    if (smConfig._cached_secrets){
        return smConfig._cached_secrets;
    }
    //
    var secretManager = require('@t23/t23-cliente-gestor-secretos');
    var iSecretManager = secretManager.getInstance(smConfig);
    var data=iSecretManager.getSecrets();
    //
    // Cache the response
    smConfig._cached_secrets=data;
    //
    return data;
}

app.get('/', (req, res) => {
    var response='';
    //
    try {
        response+='Application is running!!\n';
        //
        // Secrets injected as environment variable
        var sharedUtils = require('@t23/t23-shared-utils');
        response+=printSecretsInEnvVariables('T23_SECRET');
        //
        // Secrets injected as files
        response+=readConfigFiles('T23_FILE_PATH');
        //
        // Secrets injected as a file by the launcher
        response+=readConfigFile('T23_LA_OUT_FILE');
        // 
        // Read Secret Manager configuration
        var smConfig=sharedUtils.readSMConfiguration();
        if(smConfig){
            // Secrets retrieved from external secret manager using API
            response+='++ Retrieving Secrets via API\n';
            var data=readSecretsFromSM(smConfig);
            for (const key in data) {
                response+='-- Secrets retreved via API '+ sharedUtils.truncador(key) +' ' + sharedUtils.truncador(data[key]) +'\n';
            }    
        } else {
            response+='++ Skipping Secrets via API as smConfig is null \n';
        }
        // 
    }catch(e){
        response+'Error fatal:'+e+'\n';
        console.error(e);
    }
    //
    console.log(response);
    //
    res.send(response);
})

app.listen(3000, () => {
    console.log('Server is up on 3000')
})

