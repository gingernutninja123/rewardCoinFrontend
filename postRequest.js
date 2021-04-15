const axios = require('axios');
const FormData=require('form-data');
const fs=require('fs');


    async function postRequest(data, url) {
        try {
            const res =await axios.post(url, data);
            console.log(`Status: ${res.status}`);
            console.log('Body: ', res.data);
            return res
        } catch (err) {
            return err;
        }

    }

async function postRequestPar(url,statusCode) {
    try {
        var url2=url;
        const res =await axios.post(url2);
        console.log(`Status: ${res.status}`);
        console.log('Body: ', res.data);
        if (res.status==statusCode){
            return res
        }
        else{
            console.log("Incorrect Status Code");
        }

    } catch (err) {
        console.error(err);
    }

}

    async function getRequest(url,accessToken) {
        try {
            const res = await axios.get(url,{headers:{
                "X-Access-Token":accessToken
                }});
            console.log(`Status: ${res.status}`);
            console.log('Body: ', res.data);
            res.headers['content-type'];
            return res
        } catch (err) {
            console.error(err);
        }
    }

async function postRequestBlob(data, url,statusCode) {
    try {
        console.log("Executing post blob");
        console.log("Request Body",data);
        const res =await axios.post(url, data,{responseType: "arraybuffer"});
        console.log(`Status: ${res.status}`);
        console.log('Body: ', res.data);
        if (res.status==statusCode){
            return res
        }
        else{
            console.log("Status code incorrect");
        }
    } catch (err) {
        console.error(err);
    }

}




    async function postFile(data,url,cardName,statusCode){
        try {
            const formData = new FormData();
            await fs.writeFileSync(cardName+`.card`, data);
            const newFile=await fs.createReadStream('./'+cardName+'.card');
            var boundary=formData.getBoundary();
            console.log('My boundary'+boundary);
            formData.append("card",newFile);
            const res =await axios.post(url, formData, {
                headers: {
                    "Content-Length":1276,
                    'Content-Type': 'multipart/form-data;boundary='+boundary,
                }
            });
            console.log(`Status: ${res.status}`);
            console.log('Body: ', res.data);
            if (statusCode==res.status){
                return res
            }
            else {
                console.log("Incorrect status code");
            }
         } catch (err) {
            console.error(err);
         }

    }
module.exports={postRequest,postRequestBlob,postFile,getRequest,postRequestPar};

