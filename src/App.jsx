import React, { useState, useEffect } from "react";
import axios from "axios";
import { createWorker } from "tesseract.js"; // For OCR
import { GoogleGenerativeAI } from "@google/generative-ai";

// Styles for the result items
const styles = {
  resultList: {
    listStyle: "none",
    padding: 0,
  },
  resultItem: {
    padding: "20px 30px", // Increased padding for more space
    borderRadius: "5px",
    margin: "15px 0", // Increased margin for better separation
    cursor: "pointer",
    transition: "background-color 0.2s ease-in-out",
    fontSize: "18px", // Increased font size for improved readability
  },
  resultItemHover: {
    backgroundColor: "#f0f0f0",
  },
};

function App() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [outputItems, setOutputItems] = useState([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingsearch, setISLoadingSearch] = useState(false);

  // Function to convert a selected image to a Base64 string
  const getImageAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const getBase64 = async (file) => {
    const base64 = await getImageAsBase64(file);
    // Extract the Base64 string without metadata
    const base64WithoutMetadata = base64.split(",")[1];
    return base64WithoutMetadata;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const imageData = await getBase64(image);
    setISLoadingSearch(true);
    const genAI = new GoogleGenerativeAI(
      "AIzaSyButeLATkr6F48xCHTOcwTj7EEqv1QgD7M"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `scan this image,give correct answer the question: ${searchQuery} and if it is not given please answer according to your thinking or past question`;
    const img = {
      inlineData: {
        data: imageData /* see JavaScript quickstart for details */,
        mimeType: "image/png",
      },
    };
    try {
      const result = await model.generateContent([prompt, img]);
      const response = await result.response;
      setSearchResults(response.text());
    } catch (error) {
      console.error("Error during API call:", error);
      setSearchResults("Failed to fetch the answer. Please try again.");
    } finally {
      setISLoadingSearch(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
    setImageUrl(URL.createObjectURL(file)); // Create a URL for the image to be displayed
    // Clear previous data
    setExtractedText("");
    setOutputItems([]);
    setSelectedItemDetails([]);
    setSearchResults([]);
    setError("");
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpload = async () => {
    setSelectedItemDetails([]);
    setSearchResults([]);
    setSearchQuery([]);
    setIsLoading(true);
    // // Simulate loading state before invoking OCR and AI processing
    // setTimeout(async () => {
    //   // Placeholder for actual upload logic
    //   setIsLoading(false);
    // }, 2000);

    setError("");

    try {
      // // Perform OCR on the image
      // const worker = await createWorker();
      // await worker.load();
      // await worker.loadLanguage('eng'); // Or other suitable language
      // await worker.initialize('eng');
      // const { data } = await worker.recognize(image);
      // const extractedText = data.text.trim(); // Clean up extracted text
      // setExtractedText(extractedText);

      setIsResultLoading(true);
      const genAI = new GoogleGenerativeAI(
        "AIzaSyButeLATkr6F48xCHTOcwTj7EEqv1QgD7M"
      ); // Replace with your API key
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageData = await getBase64(image);

      console.log(imageData);

      // **Sending Text to Gemini Pro (Consider limitations of free API):**
      const prompt = `Analyze the following image and identify all ingredients and all chemicals or preservative and food items and all nutritions which are used in food which are in image , give result items in new lines with numbers`;
      const img = {
        inlineData: {
          data: imageData /* see JavaScript quickstart for details */,
          mimeType: "image/png",
        },
      };
      const result = await model.generateContent([prompt, img]);
      const response = result.response;
      const text = response.text();

      setExtractedText(text);
      setIsLoading(false);
      // Parse response text into an array of items
      const outputItems = text
        .split("\n")
        .filter((item) => item.trim()) // Remove empty lines
        .map((item, index) => ({
          id: index + 1,
          content: item,
          hoverColor: `hsl(${Math.random() * 360}, 100%, 70%)`,
        })); // Generate random hover colors

      console.log(outputItems);
      setOutputItems(outputItems);

      setIsResultLoading(false);
    } catch (error) {
      console.error("Error processing image:", error);
      if (error.name === "Error in loading wasm code") {
        setError(
          "Failed to load OCR engine. Please check your network connection or try again later."
        );
      } else {
        setError(
          "Failed to process image. Please try again, or consider using a paid API for better results."
        );
      }
    } finally {
      setIsLoading(false);
      // await worker.terminate();
    }
  };

  const handleItemClick = async (itemContent) => {
    setIsItemLoading(true);
    const genAI = new GoogleGenerativeAI(
      "AIzaSyButeLATkr6F48xCHTOcwTj7EEqv1QgD7M"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Updated prompt for better structured output
    const prompt = `Provide detailed health information about the ingredient: ${itemContent}.
  Benefits:
  - List the health benefits of consuming the ingredient in a single paragraph.
  Risks:
  - Mention any potential risks or side effects associated with excessive consumption in a single paragraph.
  Safe Consumption:
  - Specify safe consumption limits for adults and children in a single paragraph.
  Ensure each section is clearly separated and formatted neatly.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const benefitsMatch = text.match(/Benefits:(.*?)Risks:/s);
      const risksMatch = text.match(/Risks:(.*?)Safe Consumption:/s);
      const safeConsumptionMatch = text.match(/Safe Consumption:(.*)/s);
      const nameMatch = text.match(/Name:(.*)/s);

      const outputItems = {
        nameMatch: nameMatch ? nameMatch[1].trim() : "",
        benefits: benefitsMatch ? benefitsMatch[1].trim() : "",
        risks: risksMatch ? risksMatch[1].trim() : "",
        safe_consumption: safeConsumptionMatch
          ? safeConsumptionMatch[1].trim()
          : "",
      };

      setSelectedItemDetails(outputItems);
    } catch (error) {
      console.error("Error fetching details:", error);
      setError("Failed to fetch details for the item. Please try again.");
    } finally {
      setIsItemLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageUrl("");
    setExtractedText("");
    setOutputItems([]);
    setError("");
    setSelectedItemDetails([]);
    setSearchResults([]);
  };

  // useEffect(() => {
  //   // Clear output items and error on new image selection
  //   if (!image) {
  //     setOutputItems([]);
  //     setError('');
  //   }
  // }, [image]);

  // const containerStyle = {
  //   width: '100%',
  //   height: '100%',
  //   backgroundColor: '#F3F3F3',
  //   backgroundImage: `linear-gradient(0deg, transparent 24%, #E1E1E1 25%, #E1E1E1 26%, transparent 27%, transparent 74%, #E1E1E1 75%, #E1E1E1 76%, transparent 77%, transparent),
  //                      linear-gradient(90deg, transparent 24%, #E1E1E1 25%, #E1E1E1 26%, transparent 27%, transparent 74%, #E1E1E1 75%, #E1E1E1 76%, transparent 77%, transparent)`,
  //   backgroundSize: '55px 55px'
  // };

  return (
    <div id="background" className="w-full h-full">
      <div className="App p-5 max-w-4xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-bold mb-2">
            Upload an image for analysis:
          </h1>
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="mb-3 mx-2 smky-btn3 relative hover:text-[#000000] py-2 px-6 after:absolute after:h-1 after:hover:h-[200%] transition-all duration-500 hover:transition-all hover:duration-500 after:transition-all after:duration-500 after:hover:transition-all after:hover:duration-500 overflow-hidden z-20 after:z-[-20] after:bg-[#56c45d] after:rounded-t-full after:w-full after:bottom-0 after:left-0 text-gray-600"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Uploaded"
              className="mt-4 mb-4 max-w-md max-h-md  border-black"
            />
          )}
          {/* <button onClick={handleUpload} disabled={!image || isLoading} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button> */}
          <button
            className="cursor-pointer transition-all 
bg-blue-700 text-white px-6 py-2 rounded-lg
border-indigo-400
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] hover:shadow-xl hover:shadow-indigo-300 shadow-indigo-300 active:shadow-none"
            onClick={handleUpload}
            disabled={!image || isLoading}
          >
            {isResultLoading ? "Analyzing..." : "Analyze Image"}
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
          <div className="App p-5">
            {/* Existing UI code... */}

            {extractedText && (
              <div className="relative">
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Ask a question about the food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                >
                  {isLoadingsearch ? "Seacrhing..." : "Search"}
                </button>
              </div>
            )}

            {/* Display search results */}
            {searchResults && (
              <div className="mt-4 p-2 bg-gray-100 border rounded">
                <h2 className="text-lg">Search Results:</h2>
                {isLoadingsearch ? (
                  <div className="animate-pulse flex flex-col space-y-4 pt-4">
                    <div className="flex flex-row space-x-2">
                      <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                      <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                      <div className="h-7 bg-slate-400 w-1/3 rounded-md"></div>
                    </div>
                  </div>
                ) : (
                  <p>{searchResults}</p>
                )}
              </div>
            )}

            {/* Rest of your UI... */}
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
                  <div
                    key={item.id}
                    className="p-3 bg-blue-100 rounded hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer"
                    onClick={() => handleItemClick(item.content)}
                  >
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
              <div className="grid grid-cols-1  gap-4">
              <li className="p-4  bg-green-100 border border-gray-300 rounded shadow-md hover:bg-green-200 transition duration-200 ease-in-out cursor-pointer">
                <strong className="block text-green-600 mb-2">Benefits:</strong>
                <p>{selectedItemDetails.benefits}</p>
              </li>
              <li className="p-4 bg-red-100 border border-gray-300 rounded shadow-md hover:bg-red-200 transition duration-200 ease-in-out cursor-pointer">
                <strong className="block text-re-600 mb-2">Risks:</strong>
                <p>{selectedItemDetails.risks}</p>
              </li>
              <li className="p-4 bg-blue-100 border border-gray-300 rounded shadow-md hover:bg-blue-200 transition duration-200 ease-in-out cursor-pointer">
                <strong className="block text-blue-600 mb-2">Safe Consumption:</strong>
                <p>{selectedItemDetails.safe_consumption}</p>
              </li>
            </div>
            )}
          </div>
        )}
        {/* <button onClick={reset} className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
          Reset
        </button> */}
        <button
          onClick={reset}
          class=" mt-4 font-bold cursor-pointer transition-all 
bg-red-500 text-white px-6 py-2 rounded-lg
border-yellow-400
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] hover:shadow-xl hover:shadow-yellow-100 shadow-orange-300 active:shadow-none "
        >
          reset
        </button>
      </div>
    </div>
  );
}

export default App;
