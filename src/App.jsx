import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createWorker } from 'tesseract.js'; // For OCR
import { GoogleGenerativeAI } from "@google/generative-ai";

// Styles for the result items
const styles = {
  resultList: {
    listStyle: 'none',
    padding: 0,
  },
  resultItem: {
    padding: '20px 30px', // Increased padding for more space
    borderRadius: '5px',
    margin: '15px 0', // Increased margin for better separation
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    fontSize: '18px', // Increased font size for improved readability
  },
  resultItemHover: {
    backgroundColor: '#f0f0f0',
  },
};


function App() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [outputItems, setOutputItems] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState([]);
  // const [selectedItemInfo, setSelectedItemInfo] = useState({}); // Array of objects for formatted output
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const reset = () => {
    setImage(null);
    setImageUrl('');
    setExtractedText('');
    setOutputItems([]);
    setError('');
  };

 

  const handleImageChange = (event) => {
    if (event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));  // Create a URL for the image to be displayed
    }
  };

  // function parseHealthDetails(text) {
  //   const regex = /^(.*?):\s*(?:\n\n)?(.*?)(?:\n\n)?(.*?)(?:\n\n)?(.*?)$/s; // Multiline regex with capturing groups
  // const match = regex.exec(text.trim());

  // if (match) {
  //   const [, benefitsTitle, benefitsContent, risksTitle, risksContent, safeConsumptionTitle, safeConsumptionContent] = match;

  //   const benefits = benefitsContent.split('\n').filter(line => line.trim()); // Split and filter non-empty lines
  //   const risks = risksContent.split('\n').filter(line => line.trim());
  //   const safeConsumptionLimits = safeConsumptionContent.split('\n').filter(line => line.trim()); // Assuming "Limits" in the title

  //   return {
  //     benefits: benefitsTitle && benefits,
  //     risks: risksTitle && risks,
  //     safeConsumptionLimits: safeConsumptionLimitsTitle && safeConsumptionLimits,
  //   };
  // }

  // return {};
  // }
  
  

  const handleItemClick = async (itemContent) => {
    setIsLoading(true);
    const genAI = new GoogleGenerativeAI('AIzaSyD-uyzXfcgIIXgUe2E290JBANROyQILAPE');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // const prompt = `Provide detailed information about the ingredient: ${itemContent}`;
    const prompt = `generate the health details of the ingredient: ${itemContent}. 1. Benefits: List the health benefits of consuming the ingredient. 2. Risks: Mention any potential risks or side effects associated with excessive consumption. 3. Safe Consumption: Specify safe consumption limits for adults and children, if available. Please provide this information in the format mentioned above, with each section separated by a colon (:) and a newline
    `;
    // const prompt = `Provide detailed information about the ingredient: ${itemContent}. how many quantify are safe for human and child in one day and what is illness are create by this item.all the information are with line number`;
    // const prompt = `Provide detailed information about the ingredient: ${itemContent}. Include health benefits, safe consumption limits, and potential risks associated with excessive consumption.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // const detailedInfo = parseHealthDetails(response.text());
      const outputItems =text.split('\n').filter(item => item.trim()) // Remove empty lines
        .map((item, index) => ({ id: index + 1, content: item, hoverColor: `hsl(${Math.random() * 360}, 100%, 70%)` }));
        console.log("Generated content", outputItems);
      setSelectedItemDetails(outputItems);
      console.log(detailedInfo);

      // const detailedInfo = parseHealthDetails(response.text());
    // setSelectedItemDetails(detailedInfo);
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Failed to fetch details for the item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please select an image file.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Perform OCR on the image
      const worker = await createWorker();
      await worker.load();
      await worker.loadLanguage('eng'); // Or other suitable language
      await worker.initialize('eng');
      const { data } = await worker.recognize(image);
      const extractedText = data.text.trim(); // Clean up extracted text
      setExtractedText(extractedText);

      const genAI = new GoogleGenerativeAI('AIzaSyD-uyzXfcgIIXgUe2E290JBANROyQILAPE'); // Replace with your API key
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // **Sending Text to Gemini Pro (Consider limitations of free API):**
      const prompt = `Analyze the following text and identify ingredients and all other necessary things which are used in food:\n\n${extractedText} \ngive result items in new lines with numbers`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response text into an array of items
      const outputItems = text.split('\n').filter(item => item.trim()) // Remove empty lines
        .map((item, index) => ({ id: index + 1, content: item, hoverColor: `hsl(${Math.random() * 360}, 100%, 70%)` })); // Generate random hover colors

      setOutputItems(outputItems);
    } catch (error) {
      console.error('Error processing image:', error);
      if (error.name === 'Error in loading wasm code') {
        setError('Failed to load OCR engine. Please check your network connection or try again later.');
      } else {
        setError('Failed to process image. Please try again, or consider using a paid API for better results.');
      }
    } finally {
      setIsLoading(false);
      // await worker.terminate();
    }
  };

  useEffect(() => {
    // Clear output items and error on new image selection
    if (!image) {
      setOutputItems([]);
      setError('');
    }
  }, [image]);

  // function parseHealthDetails(text) {
  //   // Define a helper function to extract information between two labels
  //   const extractBetween = (text, startLabel, endLabel) => {
  //     const startIndex = text.indexOf(startLabel) + startLabel.length;
  //     const endIndex = endLabel ? text.indexOf(endLabel, startIndex) : text.length;
  //     return text.slice(startIndex, endIndex).trim();
  //   };
  
  //   // Example labels used to identify sections in the text
  //   const benefitsLabel = "Benefits:";
  //   const risksLabel = "Risks:";
  //   const safeConsumptionLabel = "Safe Consumption:";
  
  //   // Extract each section based on labels
  //   const benefits = extractBetween(text, benefitsLabel, risksLabel);
  //   const risks = extractBetween(text, risksLabel, safeConsumptionLabel);
  //   const safety = extractBetween(text, safeConsumptionLabel);
  
  //   return {
  //     benefits,
  //     risks,
  //     safety
  //   };
  // }
  

  return (
    <div className="App p-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold mb-2">Upload an image for analysis:</h1>
        <input type="file" onChange={handleImageChange} accept="image/*" className="mb-3"/>
        {imageUrl && <img src={imageUrl} alt="Uploaded" className="mt-4 mb-4 max-h-64 mx-auto"/>}
        <button onClick={handleUpload} disabled={!image || isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-bold">Extracted Text:</h2>
          <p className="border p-2 rounded bg-gray-100">{extractedText}</p>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <h2 className="text-lg font-bold">Results:</h2>
          <div className="grid grid-cols-3 gap-4">
            {outputItems.map((item) => (
              <div key={item.id} className="p-3 bg-blue-100 rounded hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer" onClick={() => handleItemClick(item.content)}>
                {item.content}
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedItemDetails && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Item Details:</h2>
           <ul>
        {selectedItemDetails.map((item, index) => (
          <li key={index}  className="p-3  bg-green-100 rounded hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer">
            <strong>{item.label}:</strong> {item.content}
          </li>
        ))}
      </ul>
        </div>
      )}

{/* <div className="mt-4">
  <h2 className="text-lg font-bold">Item Details:</h2>
  <div>
    <p><strong>Benefits:</strong> {selectedItemDetails.benefits}</p>
    <p><strong>Risks:</strong> {selectedItemDetails.risks}</p>
    <p><strong>Safe Consumption Limits:</strong> {selectedItemDetails.safeConsumption}</p>
  </div>
</div> */}
      <button onClick={reset} className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
        Reset
      </button>
    </div>
  );
}

export default App;


