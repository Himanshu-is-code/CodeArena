const axios = require('axios');

const getLanguageById = (lang)=>{
    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }
    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions)=>{
  const options = {
    method: 'POST',
    url: 'https://ce.judge0.com/submissions/batch',
    params: {
      base64_encoded: 'false'
    },
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      submissions
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Judge0 submitBatch error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

const waiting = (timer)=>{
  return new Promise((resolve)=> setTimeout(resolve, timer));
}

const submitToken = async(resultToken)=>{
  const options = {
    method: 'GET',
    url: 'https://ce.judge0.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };

  while(true){
    try {
      const response = await axios.request(options);
      const result = response.data;

      if(result && result.submissions){
        const IsResultObtained = result.submissions.every((r)=>r.status_id > 2);

        if(IsResultObtained)
          return result.submissions;
      }
    } catch(error) {
      console.error('Judge0 submitToken error:', error.response ? error.response.data : error.message);
    }

    await waiting(1000);
  }
}

module.exports = {getLanguageById,submitBatch,submitToken};
