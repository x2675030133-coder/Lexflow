import { getAllArticles, storeCachedArticles } from '../data/readingLibrary';
import { isArticleRead } from '../utils/readingProgress';
import { refreshReadingLibrarySnapshot } from './readingLibraryApi';

export async function refreshReadingCache() {
  const unreadCount = getAllArticles().filter((article) => !isArticleRead(article)).length;
  if (unreadCount > 0) {
    return [];
  }

  const snapshot = await refreshReadingLibrarySnapshot();
  if (snapshot.articles.length > 0) {
    storeCachedArticles(snapshot.articles, snapshot.meta);
  }
  return snapshot.articles;
}
