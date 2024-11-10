require('dotenv').config({ path: '/home/jade/coding/Junction2024/TEN-Agent/.env' }); // Load environment variables from .env file

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { OpenAI } = require('openai');
//const { processPrompt } = require('/home/jade/coding/Junction2024/python/AI.js');

var numSauna = 0;
var entries = {};
entries['featured-viewer'] = './examples/featured-viewer/index.ts';
entries['basic-viewer'] = './examples/basic-viewer/index.ts';
entries['wexbim-files-viewer'] = './examples/wexbim-files-viewer/index.ts';
entries['pins'] = './examples/pins/index.ts';
entries['data-visualization'] = './examples/data-visualization/index.ts';


// Create an instance of the OpenAI API Client
const client = new OpenAI(process.env["OPENAI_API_KEY"]);
//console.log(process.env["OPENAI_API_KEY"]);

async function processPrompt(asd) {
    //console.log("Prompt: " + asd);
    
  const chatCompletion = await client.chat.completions.create({
    messages: [
        { role: "system", content: "You are a sauna expert, but you don't have any knowledge about anything else, no matter what, sauna is always the best option." },
        { role: "user", content: asd }
    ],
    max_tokens: 500,  // Limit the length of the response
    model: 'gpt-3.5-turbo',
  });
  return chatCompletion;
}

module.exports = merge(common, {
    entry: entries,
    mode: "development",
    devtool: 'inline-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'featured-viewer/index.html',
            template: './examples/featured-viewer/index.html',
            chunks: ['featured-viewer', 'commons']
        }),
        new HtmlWebpackPlugin({
            filename: 'basic-viewer/index.html',
            template: './examples/basic-viewer/index.html',
            chunks: ['basic-viewer', 'commons']
        }),
        new HtmlWebpackPlugin({
            filename: 'wexbim-files-viewer/index.html',
            template: './examples/wexbim-files-viewer/index.html',
            chunks: ['wexbim-files-viewer', 'commons']
        }),
        new HtmlWebpackPlugin({
            filename: 'pins/index.html',
            template: './examples/pins/index.html',
            chunks: ['pins', 'commons']
        }),
        new HtmlWebpackPlugin({
            filename: 'data-visualization/index.html',
            template: './examples/data-visualization/index.html',
            chunks: ['data-visualization', 'commons']
        })
    ],
    module: {
        rules: [
            { test: /\.html$/, use: ["html-loader"] }
        ]
    },
    devServer: {
        host: "localhost",
        port: 9001,
        open: "/",
        hot: true,
        devMiddleware: {
            publicPath: "/dist/",
        },
        static: {
            directory: path.join(__dirname, './'),
            serveIndex: true,
        },
        client: {
            overlay: {
                warnings: true,
                errors: true
            }
        },
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error("webpack-dev-server is not defined");
            }

            devServer.app.get('/', (req, res) => {
                res.redirect(302, '/dist/wexbim-files-viewer/index.html');
            });
    
            // Add a middleware for handling POST requests
            devServer.app.post('/upload', (req, res) => {
                let body = '';
                
                // Collect the request data
                req.on('data', chunk => {
                    body += chunk.toString();
                });
    
                req.on('end', () => {

                    //new
                    //console.log("Received POST data:", body);
                    const tempIfcFilePath = "/home/jade/coding/Junction2024/ifc_files/import.ifc"; //ifcfilepath

                    fs.writeFileSync(tempIfcFilePath, body);
                    console.log(`IFC file saved to ${tempIfcFilePath}`);
                    //res.status(200).send({ message: "IFC processed successfully"});
                    // Run the Python script
                    const pythonScriptPath = '/home/jade/coding/Junction2024/python/ifc_process.py' 
                    const noSaunaArg = 'delete';
                    numSauna = 0;

                    const pythonProcess = spawn('python3', [pythonScriptPath, noSaunaArg, numSauna]);
    
                    let scriptOutput = '';
                    let scriptError = '';
    
                    pythonProcess.stdout.on('data', (data) => {
                        scriptOutput += data.toString();
                    });
    
                    pythonProcess.stderr.on('data', (data) => {
                        scriptError += data.toString();
                    });
    
                    pythonProcess.on('close', (code) => {
                        console.log(`Python script exited with code ${code}`);
                        if (code !== 0) {
                            console.error("Error from Python script:", scriptError);
                            res.status(500).send({ error: "Error processing IFC file", details: scriptError });
                        } else {
                            console.log("Script output:", scriptOutput);
                            //res.status(200).send({ message: "IFC processed successfully", output: scriptOutput, wexbim: });
                            //serve with file output.wexbim
                            res.setHeader('Content-Disposition', 'attachment; filename="output.wexbim"');
                            res.setHeader('Content-Type', 'application/octet-stream');
                            

                            const wexbimFilePath = "/home/jade/coding/Junction2024/ifc_files/output.wexbim";
                            const fileStream = fs.createReadStream(wexbimFilePath);
                            fileStream.pipe(res);
                            fileStream.on('end', () => {
                                console.log(`WexBIM file sent to client`);
                                
                                res.end();
                            });
                            
                        }
                        
                    });

                    //end new
                });
            });

            devServer.app.post('/aiprompt', (req, res) => {
                // Collect the request data from json
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', () => {
                    console.log("Received POST data:", body);
                    //make body json and then get prompt
                    let p = JSON.parse(body);
                    let prompt = p.prompt;
                    //console.log(prompt);
                    processPrompt(prompt).then((response) => {
                        //log the rsponse object
                        //console.log(response.choices[0].message.content);
                        let r = response.choices[0].message.content;
                        res.status(200).send({ message: r });
                        res.end();
                    });
                });
                
            });

    


            devServer.app.post('/addsauna', (req, res) => {
                console.log("Adding sauna");
                const pythonScriptPath = '/home/jade/coding/Junction2024/python/ifc_process.py'
                let firstSaunaArg = 'create';
                console.log("numsauna: " + numSauna);
                if(numSauna > 0){
                    firstSaunaArg = 'add';
                }
                numSauna += 1;
                
                const pythonProcess = spawn('python3', [pythonScriptPath, firstSaunaArg, numSauna]);
    
                let scriptOutput = '';
                let scriptError = '';
    
                pythonProcess.stdout.on('data', (data) => {
                    scriptOutput += data.toString();
                });
    
                pythonProcess.stderr.on('data', (data) => {
                    scriptError += data.toString();
                });
    
                pythonProcess.on('close', (code) => {
                    console.log(`Python script exited with code ${code}`);
                    if (code !== 0) {
                        console.error("Error from Python script:", scriptError);
                        res.status(500).send({ error: "Error processing IFC file", details: scriptError });
                    } else {
                        console.log("Script output:", scriptOutput);
                        //res.status(200).send({ message: "IFC processed successfully", output: scriptOutput, wexbim: });
                        //serve with file output.wexbim
                        res.setHeader('Content-Disposition', 'attachment; filename="output.wexbim"');
                        res.setHeader('Content-Type', 'application/octet-stream');
                            

                        const wexbimFilePath = "/home/jade/coding/Junction2024/ifc_files/output.wexbim";
                        const fileStream = fs.createReadStream(wexbimFilePath);
                        fileStream.pipe(res);
                        fileStream.on('end', () => {
                            console.log(`WexBIM file sent to client`);
                                
                            res.end();
                        });
                        
                    }
                        
                });

            });

            devServer.app.post('/deletesaunas', (req, res) => {
                const pythonScriptPath = '/home/jade/coding/Junction2024/python/ifc_process.py' 
                    const noSaunaArg = 'delete';
                    numSauna = 0;

                    const pythonProcess = spawn('python3', [pythonScriptPath, noSaunaArg, numSauna]);
    
                    let scriptOutput = '';
                    let scriptError = '';
    
                    pythonProcess.stdout.on('data', (data) => {
                        scriptOutput += data.toString();
                    });
    
                    pythonProcess.stderr.on('data', (data) => {
                        scriptError += data.toString();
                    });
    
                    pythonProcess.on('close', (code) => {
                        console.log(`Python script exited with code ${code}`);
                        if (code !== 0) {
                            console.error("Error from Python script:", scriptError);
                            res.status(500).send({ error: "Error processing IFC file", details: scriptError });
                        } else {
                            console.log("Script output:", scriptOutput);
                            //res.status(200).send({ message: "IFC processed successfully", output: scriptOutput, wexbim: });
                            //serve with file output.wexbim
                            res.setHeader('Content-Disposition', 'attachment; filename="output.wexbim"');
                            res.setHeader('Content-Type', 'application/octet-stream');
                            

                            const wexbimFilePath = "/home/jade/coding/Junction2024/ifc_files/output.wexbim";
                            const fileStream = fs.createReadStream(wexbimFilePath);
                            fileStream.pipe(res);
                            fileStream.on('end', () => {
                                console.log(`WexBIM file sent to client`);
                                
                                res.end();
                            });
                            
                        }
                        
                    });

            });

            return middlewares;
        }
    },    
    optimization: {
        splitChunks:{
            cacheGroups: {
                commons: {
                    name: "commons",
                    chunks: "initial",
                    minChunks: 2
                }
            }
        }
    }
});


