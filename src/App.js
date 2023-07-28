// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const baseURL = "http://localhost:3100";

  const [files, setFiles] = useState([]);
  const [bucketContents, setBucketContents] = useState([]);

  useEffect(() => {
    // Fetch bucket contents on component mount
    fetchBucketContents();
  }, []);

  // const fetchBucketContents = async () => {
  //   try {
  //     const res = await axios.get(`${baseURL}/minioDirectory`);
  //     setBucketContents(res.data);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

 const fetchBucketContents = () => {
   const eventSource = new EventSource(`${baseURL}/minioDirectory`);
   eventSource.onmessage = (event) => {
     const data = JSON.parse(event.data);
     setBucketContents((prevBucketContents) => {
       // Clear existing data before appending new data
       if (prevBucketContents.length === 0) {
         return [data];
       } else {
         return [...prevBucketContents, data];
       }
     });
   };
   eventSource.onerror = (err) => {
     console.error(err);
     eventSource.close();
   };
 };


  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    try {
      // Get presigned URLs for each file
      const res = await axios.post(`${baseURL}/presignedUrl`, {
        files: Array.from(files).map((file) => file.name),
      });
      const presignedUrls = res.data;

      // Upload each file to Minio using the presigned URL
      for (let i = 0; i < files.length; i++) {
        await axios.put(presignedUrls[i], files[i]);
      }

      // Fetch updated bucket contents
      fetchBucketContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoad = async (objectName) => {
    try {
      // Get presigned URL for the selected object
      const res = await axios.post(`${baseURL}/loadObject`, {
        files: [objectName],
      });
      const presignedUrl = res.data[0];

      // Load object from Minio using the presigned URL
      window.open(presignedUrl, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Minio File Upload and Load</h1>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <h2>Bucket Contents</h2>
      <ul>
        {bucketContents.map((object) => (
          <li key={object.name}>
            {object.name}{" "}
            <button onClick={() => handleLoad(object.name)}>Load</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
