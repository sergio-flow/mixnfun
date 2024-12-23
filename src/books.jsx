import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from "@supabase/supabase-js";
import LazyLoad from 'react-lazyload';
import { saveAs } from 'file-saver';
import Resizer from "react-image-file-resizer";
import { Link } from "react-router-dom";
import './books.css';

const books = [
  {
    "title": "Pyramid Texts",
    "date": "c. 2400–2300 BCE",
    "description": "Ancient Egyptian funerary inscriptions."
  },
  {
    "title": "Epic of Gilgamesh",
    "date": "c. 2100 BCE",
    "description": "Sumerian epic poem."
  },
  {
    "title": "Rigveda",
    "date": "c. 1500–1200 BCE",
    "description": "Ancient Indian collection of Vedic Sanskrit hymns."
  },
  {
    "title": "Egyptian Book of the Dead",
    "date": "c. 1550 BCE",
    "description": "Egyptian funerary text."
  },
  {
    "title": "Avestan texts",
    "date": "c. 1200–600 BCE",
    "description": "Zoroastrian scriptures, including the Avesta."
  },
  {
    "title": "Torah",
    "date": "c. 1200–1000 BCE",
    "description": "The first five books of the Hebrew Bible."
  },
  {
    "title": "I Ching (Book of Changes)",
    "date": "c. 1000–750 BCE",
    "description": "Ancient Chinese divination text."
  },
  {
    "title": "Sama Veda, Yajur Veda, Atharva Veda",
    "date": "c. 1200–900 BCE",
    "description": "Other Vedas complementing Rigveda."
  },
  {
    "title": "Homer's Iliad and Odyssey",
    "date": "c. 800–700 BCE",
    "description": "Greek epic poems."
  },
  {
    "title": "Upanishads",
    "date": "c. 800–200 BCE",
    "description": "Ancient Indian philosophical texts."
  },
  {
    "title": "Tanakh (Hebrew Bible)",
    "date": "c. 1200–100 BCE",
    "description": "Canonical collection of Jewish texts."
  },
  {
    "title": "Tao Te Ching",
    "date": "c. 600–400 BCE",
    "description": "Foundational text of Taoism attributed to Laozi."
  },
  {
    "title": "Buddhist Pali Canon (Tripitaka)",
    "date": "c. 5th century BCE",
    "description": "Early Buddhist scriptures."
  },
  {
    "title": "Mahabharata and Ramayana",
    "date": "c. 400 BCE–200 CE",
    "description": "Epic narratives of ancient India."
  },
  {
    "title": "Bhagavad Gita",
    "date": "c. 5th–2nd century BCE",
    "description": "A 700-verse Hindu scripture that is part of the Indian epic Mahabharata."
  },
  {
    "title": "Confucian Analects",
    "date": "c. 5th century BCE",
    "description": "Collection of teachings and ideas attributed to Confucius."
  },
  {
    "title": "New Testament",
    "date": "c. 1st century CE",
    "description": "Second part of the Christian biblical canon."
  },
  {
    "title": "Nag Hammadi Library",
    "date": "c. 2nd–4th century CE",
    "description": "Early Christian and Gnostic texts."
  },
  {
    "title": "Quran",
    "date": "c. 610–632 CE",
    "description": "Central religious text of Islam."
  },
  {
    "available": true,
    "title": "Emerald Tablet",
    "date": "6th–8th century CE",
    "description": "Esoteric alchemical text."
  },
  {
    "title": "The Divine Comedy by Dante Alighieri",
    "date": "c. 1308–1320 CE",
    "description": "Epic poem describing the journey through Hell, Purgatory, and Heaven."
  },
  {
    "title": "The Book of Mormon",
    "date": "1830",
    "description": "Religious text of the Latter Day Saint movement."
  },
  {
    "title": "The Tao of Pooh by Benjamin Hoff",
    "date": "1982",
    "description": "Explores Taoism through the characters of Winnie-the-Pooh."
  },
  {
    "title": "The Power of Now by Eckhart Tolle",
    "date": "1997",
    "description": "Modern spiritual guide to mindfulness and living in the present moment."
  }
].reverse()

const languages = ["English", "Chinese", "Hindi", "Spanish", "French", "Arabic", "Romanian", "Russian"]
const shortLanguages = ["EN", "ZH", "HI", "ES", "FR", "AR", "RU", "PT", "RO"]

export default function Books() {
  const [lang, setLang] = useState("EN")

  return (
    <div className="app">
      <div className='main-header'>
        <Link to={'/'}>GIFs</Link>
        <Link className='active' to={'/books'}>BOOKs</Link>
        <Link to={'/tools'}>TOOLs</Link>
      </div>

      <div className='file-uploader'>
        <div className='details'>
          <img className='logo' src="/logo-black.png" alt="logo" />
          <h1>Bionical. Lyrical. Reading.</h1>
          <p>Don't force reading.</p>
          <p>Let it happen naturally.</p>
          {/* <p>+ Daily Email Follow-ups</p> */}
        </div>
      </div>

      <h2 className='last-100-title'>
        Ancient Classics (newest to oldest)

        {/* <span className='languages'>
          {shortLanguages.map((l, i) => (
            <span className={lang === l ? "active" : ""} key={i}>{l}</span>
          ))}
        </span> */}
      </h2>

      <div className='list books'>
        {books.map((book, index) => {
          if (book.available) {
            return (
              <Link key={index} className='post' to={`/books/${encodeURIComponent(book.title)}`}>
                <h3>{book.title}</h3>
                <h6>{book.date}</h6>
                <h6>{book.description}</h6>
                <span className='label available'>Available</span>
                {/* <span className='footnote'>{Math.floor(Math.random() * 500) + 1} readers today</span> */}
              </Link>
            )
          }

          return (
            <div key={index} className='post'>
              <h3>{book.title}</h3>
              <h6>{book.date}</h6>
              <h6>{book.description}</h6>
              <span className='label not-available'>Coming soon</span>
              {/* <span className='footnote'>{Math.floor(Math.random() * 500) + 1} readers today</span> */}
            </div>
          )
        })}
      </div>
    </div>
  );
}
