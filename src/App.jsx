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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [isItemLoading , setIsItemLoading] = useState(false)
  
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
    setImageUrl(URL.createObjectURL(file));  // Create a URL for the image to be displayed
    // Clear previous data
    setExtractedText('');
    setOutputItems([]);
    setSelectedItemDetails([]);
    setError('');
  };

  
  
  const handleUpload = async () => {
    setIsLoading(true);
    // Simulate loading state before invoking OCR and AI processing
    setTimeout(async () => {
      // Placeholder for actual upload logic
      setIsLoading(false);
    }, 2000);
  

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

      setIsResultLoading(true)
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
      setIsResultLoading(false)
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

  const handleItemClick = async (itemContent) => {
    setIsItemLoading(true);
    const genAI = new GoogleGenerativeAI('AIzaSyD-uyzXfcgIIXgUe2E290JBANROyQILAPE');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // const prompt = `Provide detailed information about the ingredient: ${itemContent}. how many quantify are safe for human and child in one day and what is illness are create by this item.all the information are with line number`;
    const prompt = `generate the health details of the ingredient: ${itemContent}. 1. Benefits: List the health benefits of consuming the ingredient. 2. Risks: Mention any potential risks or side effects associated with excessive consumption. 3. Safe Consumption: Specify safe consumption limits for adults and children, if available. Please provide this information in the format mentioned above, with each section separated by a colon (:) and a newline
    `;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const outputItems = text.split('\n').filter(item => item.trim()) // Remove empty lines
        .map((item, index) => ({ id: index + 1, content: item, hoverColor: `hsl(${Math.random() * 360}, 100%, 70%)` }));
      setSelectedItemDetails(outputItems);
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Failed to fetch details for the item. Please try again.');
    } finally {
      setIsItemLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageUrl('');
    setExtractedText('');
    setOutputItems([]);
    setError('');
    setSelectedItemDetails([]);
  };


  // useEffect(() => {
  //   // Clear output items and error on new image selection
  //   if (!image) {
  //     setOutputItems([]);
  //     setError('');
  //   }
  // }, [image]);
   
  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F3F3',
    backgroundImage: `linear-gradient(0deg, transparent 24%, #E1E1E1 25%, #E1E1E1 26%, transparent 27%, transparent 74%, #E1E1E1 75%, #E1E1E1 76%, transparent 77%, transparent),
                       linear-gradient(90deg, transparent 24%, #E1E1E1 25%, #E1E1E1 26%, transparent 27%, transparent 74%, #E1E1E1 75%, #E1E1E1 76%, transparent 77%, transparent)`,
    backgroundSize: '55px 55px'
  };

  
    return (
      <div id="background" className='w-full h-full'>
      <div className="App p-5 max-w-4xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-bold mb-2">Upload an image for analysis:</h1>
          <input type="file" onChange={handleImageChange} accept="image/*" className="mb-3 mx-2 smky-btn3 relative hover:text-[#000000] py-2 px-6 after:absolute after:h-1 after:hover:h-[200%] transition-all duration-500 hover:transition-all hover:duration-500 after:transition-all after:duration-500 after:hover:transition-all after:hover:duration-500 overflow-hidden z-20 after:z-[-20] after:bg-[#56c45d] after:rounded-t-full after:w-full after:bottom-0 after:left-0 text-gray-600"/>
          {imageUrl && <img src={imageUrl} alt="Uploaded" className="mt-4 mb-4 max-w-full h-auto mx-auto  border-black"/>}
          {/* <button onClick={handleUpload} disabled={!image || isLoading} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button> */}
          <button className="cursor-pointer transition-all 
bg-blue-700 text-white px-6 py-2 rounded-lg
border-indigo-400
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] hover:shadow-xl hover:shadow-indigo-300 shadow-indigo-300 active:shadow-none" onClick={handleUpload} disabled={!image || isLoading}>
  {isLoading ? 'Analyzing...' : 'Analyze Image'}
</button>
        </div>
        <div>
          <div>
            <h2 className="text-lg font-bold">Extracted Text:</h2>
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center gap-4 w-full">
                <div className="w-full h-6 bg-slate-400 rounded-md"></div>
                <div className="w-2/3 h-4 bg-slate-400 mx-auto mt-3 rounded-md"></div>
              </div>
            ) : (
              <p className="border p-2 rounded bg-gray-100">{extractedText}</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">Results:</h2>
            {isResultLoading ? (
              <div className="animate-pulse flex flex-col space-y-4 pt-4">
                <div className="flex flex-row space-x-2">
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {outputItems.map((item) => (
                  <div key={item.id} className="p-3 bg-blue-100 rounded hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer" onClick={() => handleItemClick(item.content)}>
                    {item.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedItemDetails && (
          <div className="mt-4">
            <h2 className="text-lg font-bold">Item Details:</h2>
            {isItemLoading ? (
              <div className="animate-pulse flex flex-col space-y-4 pt-4">
                <div className="flex flex-row space-x-2">
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                  <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                </div>
                <div className="w-2/3 h-4 bg-slate-400 mx-auto mt-3 rounded-md"></div>
              </div>
            ) : (
              <ul>
                {selectedItemDetails.map((item, index) => (
                  <li key={index} className="p-3 bg-green-100 rounded hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer">
                    <strong>{item.label}:</strong> {item.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* <button onClick={reset} className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
          Reset
        </button> */}
        <button onClick={reset} class=" mt-4 font-bold cursor-pointer transition-all 
bg-red-500 text-white px-6 py-2 rounded-lg
border-yellow-400
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] hover:shadow-xl hover:shadow-yellow-100 shadow-orange-300 active:shadow-none ">
  reset
</button>
      </div>
      </div>
    );
}

export default App;




