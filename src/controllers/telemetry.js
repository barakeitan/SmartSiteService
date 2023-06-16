const http = require("http");

exports.getAllTelemetry = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            console.log(d);
            data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        console.log("on finish");
        console.log(res_data);
    });
};

exports.get_updates_table = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        path: "/table",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            console.log(d);
            data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        console.log("on finish");
        console.log(res_data);
    });
};

exports.get_last = (req, res) => {
    const options = {
        hostname: "127.0.0.1",
        path: "/last",
        port: 8001,
        method: "GET"
    };

    let res_data="";

    const request = http.request(options, api_res =>{
        let data = '';
        api_res.on("data", d => {
            console.log(d);
            data = d;
        });

        api_res.on("error", error =>{
            console.log({"error":error});
        });
    
        api_res.on("end", () =>{
            try {
                res_data = JSON.parse(data);
                process.stdout.write(data);
                res.status(200).json(res_data);
            } catch (error) {
                res.status(401).write(error);
            }
        });
    });

    request.end();

    request.on('finish', () => {
        console.log("on finish");
        console.log(res_data);
    });
};