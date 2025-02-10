import { VisualizationMessage } from './VisualizationMessage';

export const Message = ({ message }) => {
  const renderMessageContent = (content) => {
    if (content.type === 'visualization') {
      return <VisualizationMessage content={content} />;
    }
    // ... other message type handling
  };

  return (
    <div className="message">
      {renderMessageContent(message.content)}
    </div>
  );
};
