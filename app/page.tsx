"use client";
import { useState } from 'react';
import Image from "next/image";
import f1Logo from "./assets/f1Logo.png";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionRow from "./components/PromptSuggestionRow";

// Define the Bubble component inline so we don't need to rely on your external component
const Bubble = ({ message }) => {
  return (
    <div className={`bubble ${message.role}`}>
      {message.content}
    </div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePrompt = async (promptText) => {
    // Set the input value to the prompt text
    setInput(promptText);
    // Then submit the form with this value
    await handleSubmit({ preventDefault: () => {} }, promptText);
  };
  
  const handleSubmit = async (e, promptContent = null) => {
    e.preventDefault();
    
    // Use either the prompt content or the input field value
    const inputContent = promptContent || input;
    if (!inputContent.trim()) return;
    
    // Add user message to state
    const userMessage = { role: 'user', content: inputContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Send request to your API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };
      
      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, assistantMessage]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode chunk and add to message content
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage.content += chunk;
        
        // Update the last message in state with new content
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...assistantMessage }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };
  
  const noMessages = messages.length === 0;
  
  return (
    <main>
      <Image src={f1Logo} width="250" alt="F1 Logo" />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              Ultimate Place for Formula One Super fans!
            </p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, idx) => (
              <Bubble key={`message-${idx}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me something related to F1"
        />
        <input type="submit" value="Send" />
      </form>
    </main>
  );
}