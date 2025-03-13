import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({onPromptClick}) => {
  const prompts = [
    "Who is head of racing for aston martin in F1?",
    "who won most races ",
    "name companies which participate in f1",
    "most Wins in f1 is backed by which company ?",
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => 
        <PromptSuggestionButton
         key={index}
         text={prompt}
         onClick={()=>onPromptClick(prompt)}
         />
      )}
    </div>
  );
};

export default PromptSuggestionRow;
