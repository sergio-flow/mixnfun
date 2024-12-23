import React, { useEffect, useState, useRef, useCallback } from 'react';
import { books } from "./books.json"
import { isMobile, isTablet, isDesktop } from 'react-device-detect';
import './book.css';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from "react-use-audio-player";
import emeraldTablet from './books/emerald-tablet.json';

const booksBaseUrl = "https://sujivvlajjatemfgpkzd.supabase.co/storage/v1/object/public/books"

// Function to count the words in the text
function countWords(str) {
  if (!str) return 0
  return str.trim().split(/\s+/).length;
}

// Words per minute
const WPM = 160;

export default function Book() {
  const bookurl = location.pathname.split("/")[2]
  const book = useRef(decodeURIComponent(bookurl)).current

  const [chapterIndex, setChapterIndex] = useState(localStorage.getItem(`${bookurl}-chapterIndex`) ? parseInt(localStorage.getItem(`${bookurl}-chapterIndex`)) : 0)
  const [gifIndex, setGifIndex] = useState(localStorage.getItem(`${bookurl}-gifIndex`) ? parseInt(localStorage.getItem(`${bookurl}-gifIndex`)) : 0)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [bionicEnabled, setBionicEnabled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [autoplay, setAutoplay] = useState(0)
  const [chapterTexts, setChapterTexts] = useState([])
  const audioRef = useRef(null)
  const voiceRef = useRef(null)
  const firstRun = useRef(true)
  const lyricsRef = useRef(null);
  const timeoutRef = useRef(null);


  const chapters = useRef(Object.entries(books[book])).current

  const { load } = useAudioPlayer();

  const chapter = chapters[chapterIndex][1]
  const totalGifs = chapterTexts.length

  // useEffect(() => {
  //   const scrollLyrics = () => {
  //     if (lyricsRef.current) {
  //       lyricsRef.current.scrollTop += 1;
  //     }
  //   };

  //   const intervalId = setInterval(scrollLyrics, 50); // Adjust the speed by changing the interval

  //   return () => clearInterval(intervalId);
  // }, []);

  useEffect(() => {
    audioRef.current = new Audio(`${booksBaseUrl}/music.mp3`);
    audioRef.current.loop = true;
  }, [])

  const checkKeyPress = useCallback((e) => {
    const { key, code } = e

    if (key === 'ArrowLeft' || code === 37) {
      e.preventDefault()
      prevGIF()
    }
    if (key === 'ArrowRight' || code === 39) {
      e.preventDefault()
      nextGIF()
    }
    if (key === 'ArrowUp' || code === 38) {
      e.preventDefault()
      prevGIF()
    }
    if (key === 'ArrowDown' || code === 40) {
      e.preventDefault()
      nextGIF()
    }
  }, [chapterTexts]);

  useEffect(() => {
    window.addEventListener("keydown", checkKeyPress);

    return () => {
      window.removeEventListener("keydown", checkKeyPress);
    };
  }, [checkKeyPress]);

  useEffect(() => {
    if (musicEnabled) {
      audioRef.current.play()
      // playVoice()
    } else {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [musicEnabled])

  const playVoice = async () => {
    if (localStorage.getItem('ekey')) {
      const data = {
        ekey: localStorage.getItem('ekey'),
        book,
        chapter: chapter.replace('.txt', ''),
        number: gifIndex + 1
      }

      load(`${booksBaseUrl}/${encodeFilename(book)}/${chapterIndex + 1}/${gifIndex + 1}.mp3`, {
        autoplay: true,
        html5: true,
        format: "mp3"
      });

      const textResponse = await fetch(`/api/check-audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      load(`${booksBaseUrl}/${encodeFilename(book)}/${chapterIndex + 1}/${gifIndex + 1}.mp3`, {
        autoplay: true,
        html5: true,
        format: "mp3"
      });
    }
  }

  useEffect(() => {
    if (autoplay) {
      // queueNextImage()
    }
  }, [autoplay])

  useEffect(() => {
    handleChapterTexts()
  }, [chapterIndex])

  const handleChapterTexts = async () => {
    const textResponse = await fetch(`/books/${book}/${chapter}`);
    const text = await textResponse.text();
    setChapterTexts(text.split("\n").filter(o => o))

    // const data = {
    //   book,
    //   chapter
    // }

    // const audioResponse = await fetch('/api/get-chapter-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }

  useEffect(() => {
    if (!firstRun.current) {
      localStorage.setItem(`${bookurl}-chapterIndex`, chapterIndex)
      localStorage.setItem(`${bookurl}-gifIndex`, gifIndex)
    }

    if (musicEnabled) {
      try {
        voiceRef.current.stop()
      } catch (e) {

      }
    }
  }, [chapterIndex, gifIndex])

  useEffect(() => {
    setTimeout(() => {
      const lyricsElement = lyricsRef.current;
      if (lyricsElement) {
        const lineElement = lyricsElement.children[gifIndex];
        if (lineElement) {
          const containerHeight = lyricsElement.clientHeight;
          const lineHeight = lineElement.clientHeight;
          const scrollPosition = lineElement.offsetTop - (containerHeight / 2 - lineHeight);
          lyricsElement.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }, 100)
  }, [gifIndex]);

  const handleReadingTime = useCallback(() => {
    if (musicEnabled) {
      const wordCount = countWords(chapterTexts[gifIndex]);
      const readingTimeMinutes = wordCount / WPM;
      const readingTimeMilliseconds = readingTimeMinutes * 60 * 1000;

      console.log(wordCount, readingTimeMilliseconds)
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Log 'next' after the calculated reading time
      timeoutRef.current = setTimeout(() => {
        nextGIF();
      }, readingTimeMilliseconds);
    }
  }, [musicEnabled, chapterTexts, gifIndex]);

  useEffect(() => {
    handleReadingTime()
  }, [gifIndex, handleReadingTime])

  useEffect(() => {
    if (!firstRun.current) {
      setGifIndex(0)
    }
  }, [chapterIndex])

  const prevGIF = () => {
    setGifIndex(prev => {
      return chapterTexts[prev - 1] ? prev - 1 : prev
    })
    firstRun.current = false;
  }

  const nextGIF = () => {
    setGifIndex(prev => chapterTexts[prev + 1] ? prev + 1 : prev)
    firstRun.current = false;
  }

  const prevChapter = () => {
    setChapterIndex(prev => chapters[prev - 1] ? prev - 1 : prev)
    firstRun.current = false;
  }

  const nextChapter = () => {
    setChapterIndex(prev => chapters[prev + 1] ? prev + 1 : prev)
    firstRun.current = false;
  }

  const changeChapter = (index) => {
    setChapterIndex(index)
    setGifIndex(0)
    setShowDropdown(false)
    firstRun.current = false;
  }

  // const play = useCallback(
  //   (override) => {
  //     if (isPlaying === false && !override) return;

  //     setTimeout(
  //       () => {
  //         playOnce(() => {
  //           const time = Math.ceil(text.length / 20) * 1000 + 800;

  //           setTimeout(() => {
  //             setRepeatNr(repeatNr + 1);
  //           }, time);
  //         });
  //       },
  //       repeatNr === 0 ? 1000 : 0,
  //     );
  //   },
  //   [repeatNr, isPlaying, text, playOnce],
  // );

  const initiateAutoplay = () => {
    alert("Feature not available yet.")
    return
    const res = prompt("Set Autoplay, 0 = disabled, 3 = 3 seconds:", "");

    const num = parseInt(res)

    if (isNaN(num)) {
      setAutoplay(0)
    } else {
      setAutoplay(num)
    }
  }

  const music = () => {
    setMusicEnabled(prev => !prev)
  }

  const triggerDropdown = () => {
    setShowDropdown(prev => !prev)
  }

  const goBack = () => {

  }

  return (
    <div className='reading'>
      <div className='title'>
        <div className='side-actions'>
          <Link to="/books" onClick={() => goBack()} className='back'>
            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 12.75H10.31L12.03 14.47C12.32 14.76 12.32 15.24 12.03 15.53C11.88 15.68 11.69 15.75 11.5 15.75C11.31 15.75 11.12 15.68 10.97 15.53L7.97 12.53C7.68 12.24 7.68 11.76 7.97 11.47L10.97 8.47C11.26 8.18 11.74 8.18 12.03 8.47C12.32 8.76 12.32 9.24 12.03 9.53L10.31 11.25H15.5C15.91 11.25 16.25 11.59 16.25 12C16.25 12.41 15.91 12.75 15.5 12.75Z" fill="#292D32" />
            </svg>
          </Link>

          {/* <button onClick={() => initiateAutoplay()} className="autoplay">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 256 256" enableBackground="new 0 0 256 256" xml:space="preserve">
              <path d="M120.5,10.1c-18.3,1.6-32.6,5.6-47.4,13.3C51.6,34.6,33.3,53.2,22.4,74.9C14,91.8,10,108.7,10,128c0,19.3,4,36.3,12.4,53c9.6,19.2,25.8,36.7,44.4,48c38.7,23.6,88.4,22.6,126.4-2.7c49.1-32.6,66.6-95.9,41.4-149.1c-5.9-12.3-13-22.3-23.2-32.6c-18.9-18.9-41-29.9-67.7-33.7C138.8,10.3,124.5,9.7,120.5,10.1z M184.1,64.6c14.9,3,26.1,15.4,27.7,30.5c2,18.1-10,34.6-27.7,38.2c-3.2,0.6-3.7,0.7-4.9,0.1c-1.5-0.8-1.9-1.6-1.9-3.5c0-2.2,1.2-3.1,5.1-3.9c17.8-3.6,27.3-22.9,19.3-39.4c-2.1-4.4-7.8-10-12.4-12.2c-16.2-7.9-35.2,1.2-39.1,18.7c-0.4,1.8-1,3.8-1.4,4.4c-1.4,2.3-5.8,1.5-6.5-1.2c-0.8-3.1,2.3-12.2,5.9-17.5c3.5-5,10.4-10.5,15.9-12.6C170.6,63.8,177.7,63.2,184.1,64.6z M147.5,100.1c0.8,0.4,7.5,6.8,14.9,14.2c10.8,10.8,13.5,13.8,13.9,15.2c0.6,2,0.1,4.2-1.2,5.7c-0.6,0.8-23.7,19.8-41.8,34.5c-2.7,2.2-5,2.8-6.1,1.7c-0.3-0.3-0.4,0.2-0.3,1.3c0.2,2.2,0,2.4-7.8,8.8c-7.3,6-8.2,6.5-10.8,6.5c-2.8,0-4.2-0.7-7.1-3.5l-2.5-2.5l-1.2,1.8c-1.5,2.3-6.2,5.8-9.5,7.1c-5.5,2.2-12.7,1.6-18.7-1.4c-10.9-5.4-19.2-15.5-22.1-26.5c-1.3-5-1.3-12.9-0.2-24.1c1.1-10.2,0.8-12.5-1.7-15.9c-1.8-2.5-1.9-4.4-0.2-5.9c2.7-2.4,5.6-0.6,8.3,4.9c1.8,3.9,2.1,9.2,1,19.4c-1.1,9.6-0.8,18,0.6,22.1c1.5,4.2,4,8.1,7.9,12c6.4,6.5,12.8,9.7,18.1,9.3c3.5-0.3,7.4-2.2,9.9-4.7c1.2-1.2,2.4-2.1,2.9-2.1c0.5,0-0.1-0.9-1.8-2.6c-4-4.2-4.8-6.6-3.4-10.1c0.9-2,11.6-15.1,13.1-15.8c0.6-0.4,1.6-0.5,2.2-0.4c1,0.3,1.1,0.2,0.6-1.1c-0.4-1-0.4-1.7,0-2.4c0.9-1.8,35.6-44,37.2-45.1C143.2,99.2,145.4,99.1,147.5,100.1z"/><path fill="#000000" d="M127.3,128.9c-11.6,14.1-17.8,21.3-18.5,21.5c-0.6,0.1-1.6,0.1-2.2,0c-0.6-0.2,3.2,4,9.1,9.9c5.6,5.6,10.2,10.2,10.2,10.2s0-1,0-2.2v-2.2l21-17.2c11.5-9.5,21.1-17.4,21.1-17.6c0.1-0.4-22.6-23.5-23.1-23.5C144.8,107.7,136.9,117.2,127.3,128.9z"/><path fill="#000000" d="M99.5,162.9c-2,2.4-3.7,4.7-3.8,5c0,0.3,2.7,3.3,6.1,6.7l6.2,6.2l4.7-3.8c2.6-2.1,4.7-4,4.7-4.1c0-0.1-3.2-3.5-7.1-7.3l-7.1-7.1L99.5,162.9z"/>
            </svg>
          </button> */}
        </div>

        <h1>{book}</h1>

        <div className='side-actions'>
          {/* <button onClick={() => setBionicEnabled(prev => !prev)} className={bionicEnabled ? "bionic enabled" : "bionic"}>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">

              <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                <path d="M2409 4540 c-1083 -81 -1906 -1034 -1829 -2117 61 -847 649 -1560 1470 -1782 542 -146 1139 -47 1607 266 1028 687 1190 2130 339 3021 -415 434 -991 656 -1587 612z m424 -1160 c323 -63 613 -226 874 -491 107 -109 177 -192 243 -290 l40 -58 -46 -68 c-70 -102 -160 -207 -271 -314 -246 -239 -516 -388 -824 -455 -120 -27 -457 -27 -577 -1 -250 55 -489 172 -702 344 -139 113 -348 343 -419 464 l-20 34 63 89 c318 444 768 721 1251 770 80 8 289 -5 388 -24z" />
                <path d="M2438 3270 c-286 -52 -521 -270 -595 -550 -23 -89 -23 -273 1 -360 73 -266 282 -473 541 -536 93 -23 258 -23 350 0 372 91 620 468 552 842 -29 159 -94 280 -212 399 -89 88 -185 146 -310 185 -79 24 -249 35 -327 20z m284 -259 c172 -59 298 -213 330 -398 34 -203 -80 -421 -270 -516 -301 -150 -658 35 -714 371 -30 179 60 383 214 485 50 33 143 71 198 81 51 9 187 -4 242 -23z" />
                <path d="M2443 2879 c-84 -26 -169 -104 -209 -191 -25 -54 -29 -75 -29 -148 0 -76 4 -93 33 -151 38 -79 101 -140 180 -177 48 -22 71 -27 142 -27 101 0 170 27 244 95 81 74 130 209 111 306 l-6 37 -19 -31 c-53 -87 -180 -106 -256 -40 -46 41 -64 77 -64 132 0 81 33 134 104 166 l39 18 -53 16 c-70 21 -141 19 -217 -5z" />
              </g>
            </svg>
          </button> */}

          {/* <button onClick={() => music()} className={musicEnabled ? "music enabled" : "music"}>
            {musicEnabled &&
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000" height="800px" width="800px" version="1.1" id="Capa_1" viewBox="0 0 39.989 39.989" xmlSpace="preserve">
                <path id="XMLID_150_" d="M19.994,0C8.952,0,0,8.952,0,19.995c0,11.043,8.952,19.994,19.994,19.994  c11.043,0,19.995-8.952,19.995-19.994C39.989,8.952,31.037,0,19.994,0z M27.744,24.526c0,1.778-1.441,3.219-3.219,3.219h-9.063  c-1.778,0-3.219-1.441-3.219-3.219v-9.063c0-1.778,1.441-3.219,3.219-3.219h9.063c1.778,0,3.219,1.441,3.219,3.219V24.526z" />
              </svg>
            }

            {!musicEnabled &&
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" viewBox="0 0 459 459" xmlSpace="preserve">
                <g>
                  <g>
                    <path d="M229.5,0C102.751,0,0,102.751,0,229.5S102.751,459,229.5,459S459,356.249,459,229.5S356.249,0,229.5,0z M310.292,239.651    l-111.764,76.084c-3.761,2.56-8.63,2.831-12.652,0.704c-4.022-2.128-6.538-6.305-6.538-10.855V153.416    c0-4.55,2.516-8.727,6.538-10.855c4.022-2.127,8.891-1.857,12.652,0.704l111.764,76.084c3.359,2.287,5.37,6.087,5.37,10.151    C315.662,233.564,313.652,237.364,310.292,239.651z" />
                  </g>
                </g>
              </svg>
            }
          </button> */}

          {/* <button onClick={() => initiateAutoplay()} className="subscribe">
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xmlSpace="preserve">
              <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
                <path d="M 45 0 C 20.147 0 0 20.147 0 45 c 0 24.853 20.147 45 45 45 s 45 -20.147 45 -45 C 90 20.147 69.853 0 45 0 z M 67.511 58.015 c 0 1.8 -1.46 3.26 -3.26 3.26 H 25.749 c -1.8 0 -3.26 -1.46 -3.26 -3.26 V 39.692 L 45 47.34 l 22.511 -7.647 V 58.015 z M 67.511 35.013 L 45 42.66 l -22.511 -7.647 v -3.028 c 0 -1.8 1.46 -3.26 3.26 -3.26 h 38.501 c 1.8 0 3.26 1.46 3.26 3.26 V 35.013 z" transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round" />
              </g>
            </svg>
          </button> */}
        </div>
      </div>

      <div className="book">
        <div className='chapter-dropdown'>
          <a onClick={() => triggerDropdown()} className='chapter-title'>{chapter.split('.')[1].trim()} ({gifIndex + 1}/{totalGifs})</a>

          <div className={showDropdown ? "chapters open" : "chapters"} data-content={chapters.length + " chapters"}>
            {chapters.map((entry, index) => (
              <a key={index} onClick={() => changeChapter(index)} title={entry[0]} className={index === chapterIndex ? 'chapter active' : 'chapter'}>{entry[1].split('.')[1].trim()}</a>
            ))}
          </div>
        </div>

        <div className='gif'>
          {/* <div className='header'>{gifIndex + 1}/{totalGifs}</div> */}

          <div className='img-container'>
            <div className='read-square'>
              <div className='lyrics' ref={lyricsRef}>
                {/* {bionicEnabled &&
                <h3><Bionic>{chapterTexts[gifIndex]}</Bionic></h3>
              }

              {!bionicEnabled &&
                <h3 className='not-bionic'>{chapterTexts[gifIndex]}</h3>
              } */}
                {chapterTexts.map((o, i) => (
                  <p key={i} className={i === gifIndex ? 'focused' : ''}>
                    {bionicEnabled &&
                      <span><Bionic>{o}</Bionic></span>
                    }

                    {!bionicEnabled &&
                      <span className='not-bionic'>{o}</span>
                    }
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className='actions'>
            <button className={musicEnabled ? "play playing" : "play"} onClick={() => setMusicEnabled(p => !p)}>{!musicEnabled ? "⏵︎" : "⏸︎"}</button>
          </div>
        </div>
      </div>

      <div className='keyboard-arrows'>
        <img src="/keyboard-arrows.png" />
      </div>
    </div>
  );
}

function encodeFilename(str) {
  // Define the characters that are invalid in filenames and folder names
  const invalidChars = /[<>:"\/\\|?*\x00-\x1F\s]/g;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

  // Replace invalid characters and whitespace with underscores
  let encodedStr = str.replace(invalidChars, '_');

  // Trim any leading or trailing underscores
  encodedStr = encodedStr.replace(/^_+|_+$/g, '');

  // Replace reserved names entirely with underscores
  if (reservedNames.test(encodedStr)) {
    encodedStr = '_';
  }

  // Return the encoded string
  return encodedStr;
}

export const Bionic = ({ children }) => {
  const bionic = (text) =>
    (text || "")
      .split(' ')
      .map(
        (word) =>
          `<b>${(word || "")
            .split('')
            .slice(0, Math.ceil(word.length / 2))
            .join('')}</b>${(word || "")
              .split('')
              .slice(Math.ceil(word.length / 2), word.length)
              .join('')} `
      )
      .join(' ')
      .toString();

  return <span dangerouslySetInnerHTML={{ __html: bionic(children) }}></span>;
};