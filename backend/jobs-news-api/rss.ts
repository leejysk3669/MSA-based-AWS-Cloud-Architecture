import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import iconv from "iconv-lite";

const FEEDS = [
  "http://www.newsnjob.com/rss/allArticle.xml",
  "http://www.newsnjob.com/rss/clickTop.xml",
  "http://www.newsnjob.com/rss/S1N1.xml", // 취업뉴스
  "http://www.newsnjob.com/rss/S1N2.xml", // 창업뉴스
  "http://www.newsnjob.com/rss/S1N3.xml", // 전직·기업
  "http://www.newsnjob.com/rss/S1N4.xml",
  "http://www.newsnjob.com/rss/S1N5.xml",
];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

async function fetchRss(url: string) {
  try {
    // 일부 국내 사이트가 EUC-KR일 수 있어 buffer로 받고 디코딩
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = (res.headers["content-type"] || "").toLowerCase();
    const isEucKr = contentType.includes("euc-kr") || contentType.includes("cp949");

    const xml = isEucKr ? iconv.decode(Buffer.from(res.data), "euc-kr") : res.data.toString("utf-8");
    const json = parser.parse(xml);

    const channel = json.rss?.channel || json.feed; // 일부는 rss, 일부는 atom
    const items = channel.item || channel.items || [];
    
    return items.map((it: any) => {
      // 이미지 URL 추출 로직 강화
      let imageUrl = null;
      
      // 1. 표준 RSS enclosure
      if (it.enclosure && it.enclosure["@_url"]) {
        imageUrl = it.enclosure["@_url"];
      }
      // 2. Media RSS content
      else if (it["media:content"] && it["media:content"]["@_url"]) {
        imageUrl = it["media:content"]["@_url"];
      }
      // 3. Media RSS thumbnail
      else if (it["media:thumbnail"] && it["media:thumbnail"]["@_url"]) {
        imageUrl = it["media:thumbnail"]["@_url"];
      }
      // 4. Media group
      else if (it["media:group"] && it["media:group"]["media:content"]) {
        const mediaContent = Array.isArray(it["media:group"]["media:content"]) 
          ? it["media:group"]["media:content"][0] 
          : it["media:group"]["media:content"];
        if (mediaContent && mediaContent["@_url"]) {
          imageUrl = mediaContent["@_url"];
        }
      }
      // 5. HTML 내용에서 이미지 태그 추출
      else if (it.description || it.content) {
        const content = it.description || it.content;
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      }
      // 6. 기타 필드에서 이미지 URL 찾기
      else if (it.image && it.image.url) {
        imageUrl = it.image.url;
      }
      else if (it.thumbnail && it.thumbnail.url) {
        imageUrl = it.thumbnail.url;
      }
      
      // 상대 URL을 절대 URL로 변환
      if (imageUrl && imageUrl.startsWith('/')) {
        try {
          const feedUrlObj = new URL(url);
          imageUrl = `${feedUrlObj.protocol}//${feedUrlObj.host}${imageUrl}`;
        } catch (e) {
          console.warn('URL 변환 실패:', e);
        }
      }
      
      return {
        title: it.title,
        link: it.link,
        pubDate: new Date(it.pubDate || it.published || it.updated || Date.now()),
        description: it.description || it.summary || "",
        source: url,
        imageUrl: imageUrl,
      };
    });
  } catch (error) {
    console.error(`RSS 피드 가져오기 실패 (${url}):`, error);
    return [];
  }
}

export async function loadAllRss() {
  console.log("뉴스앤잡 RSS 피드에서 뉴스 가져오는 중...");
  
  const lists = await Promise.allSettled(FEEDS.map(fetchRss));
  const merged = lists
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    // 중복 제거 (링크 기준)
    .filter((v, i, arr) => arr.findIndex((x) => x.link === v.link) === i)
    // 최신순 정렬
    .sort((a, b) => +b.pubDate - +a.pubDate);
  
  // 이미지가 있는 기사 수 계산
  const articlesWithImages = merged.filter(item => item.imageUrl).length;
  
  console.log(`총 ${merged.length}개의 뉴스 기사를 가져왔습니다.`);
  console.log(`이미지가 있는 기사: ${articlesWithImages}개 (${Math.round(articlesWithImages / merged.length * 100)}%)`);
  
  return merged;
}
