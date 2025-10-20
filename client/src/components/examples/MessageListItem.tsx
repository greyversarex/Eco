import MessageListItem from '../MessageListItem';

export default function MessageListItemExample() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <MessageListItem
        id="1"
        subject="Дар бораи лоиҳаи нави экологӣ"
        sender="Раёсати Душанбе"
        date="20.10.2025"
        isRead={false}
        hasAttachment={true}
        onClick={() => console.log('Message clicked')}
      />
      <MessageListItem
        id="2"
        subject="Ҳисобот оиди фаъолияти моҳ"
        sender="Агентии обухаводонимоси"
        date="19.10.2025"
        isRead={true}
        hasAttachment={false}
        onClick={() => console.log('Message clicked')}
      />
    </div>
  );
}
