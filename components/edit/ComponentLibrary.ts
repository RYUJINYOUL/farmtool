import GalleryComponent from '../template/Gallery3';
import CalendarComponent from '../template/Calendar';
import LinkCard from '../template/LinkCard';
import QuestBook from '../template/QuestBook'





export const ComponentLibrary: Record<string, React.FC<any>> = {
  이미지: GalleryComponent,
  링크카드:LinkCard,
  게스트북:QuestBook,
  달력: CalendarComponent
};