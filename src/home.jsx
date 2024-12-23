import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from "@supabase/supabase-js";
import LazyLoad from 'react-lazyload';
import { saveAs } from 'file-saver';
import Resizer from "react-image-file-resizer";
import { Link } from "react-router-dom";
import './home.css';

const baseUrl = import.meta.env.DEV ? "http://localhost:3000" : 'https://www.mixnfun.com';
const supabaseUrl = `https://sujivvlajjatemfgpkzd.supabase.co`;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1aml2dmxhamphdGVtZmdwa3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2OTM3MzUsImV4cCI6MjAzNjI2OTczNX0.9OKOimiuCukVDxo1ulGIPyjd56i3CuQda7HuN0PDel0";
const supabase = createClient(supabaseUrl, supabaseKey);

const emptyItems = Array.from({ length: 5 }, (_, i) => ({ key: i + 1, time: 1000 }));

export default function Home() {
  const [finalGIF, setFinalGIF] = useState(null);
  const [finalGIFUrl, setFinalGIFUrl] = useState(null);
  const [gifs, setGifs] = useState([]);
  const [items, setItems] = useState(emptyItems);
  const [loading, setLoading] = useState(false);
  const [letsGo, setLetsGo] = useState(false);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    fetchGIFs();
  }, []);

  const fetchGIFs = async () => {
    const { data } = await supabase.from("gifs").select().not('gif_url', 'is', null).not('preview_url', 'is', null).limit(120).order('id', { ascending: false });
    //const urls = data.map(({ filename }) => `${supabaseUrl}/storage/v1/object/public/gifs/public/${encodeURIComponent(filename)}`);
    setGifs(data);
  };

  const handleFrameUpload = async (file, key) => {
    setLoading(true)
    const image = await resizeFile(file);
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${file.name.split('.').pop()}`;
    try {
      await supabase.storage.from('images').upload(`public/${uniqueFilename}`, image, { cacheControl: '3600', upsert: false });

      const imageTransformed = await supabase
        .storage
        .from('images')
        .createSignedUrl(`public/${uniqueFilename}`, 60000, {
          transform: {
            width: 800,
            height: 800,
            quality: 80,
            resize: "cover"
          }
        })

      const imageUrl = imageTransformed.data.signedUrl

      updateFrame(key, { image: imageUrl });
    } catch (e) {
      console.log(e)
      alert('Some error happened');
    }
    setLoading(false)
  };

  const handleTextFrame = async (key) => {
    setLoading(true)
    const res = prompt("Please enter the text:", "");
    if (!res) {
      setLoading(false)
      return
    }
    const response = await fetch(`${baseUrl}/api/text-to-image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: truncateString(res) }) });
    const blob = await response.blob();
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
    await supabase.storage.from('images').upload(`public/${uniqueFilename}`, blob, { cacheControl: '3600', upsert: false });
    updateFrame(key, { image: `${supabaseUrl}/storage/v1/object/public/images/public/${uniqueFilename}` });
    setLoading(false)
  };

  const updateFrame = (key, update) => {
    setItems(items.map(item => item.key === key ? { ...item, ...update } : item));
  };

  const handleDeleteFrame = (key) => {
    updateFrame(key, { image: null });
  };

  const generateGIF = async () => {
    const images = items.filter(o => o.image).map(o => ({ ...o, time: o.time || 1000 }));
    if (images.length < 2) {
      alert("Please add at least 2 frames to the GIF.")
      return
    }
    setLoading(true);
    const response = await fetch(`${baseUrl}/api/generate-gif`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images }) });
    const blob = await response.blob();
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 10000)}.gif`;
    await supabase.storage.from('gifs').upload(`public/${uniqueFilename}`, blob, { cacheControl: '3600', upsert: false });
    const gifUrl = `${supabaseUrl}/storage/v1/object/public/gifs/public/${uniqueFilename}`;
    setFinalGIF(blob);
    setFinalGIFUrl(gifUrl);
    setLoading(false);
  };

  const downloadGIF = () => {
    saveAs(finalGIF, `${new Date().toISOString().replace(/[:.]/g, '-')}-MixNFun.gif`);
  };

  const resetApp = () => {
    setItems(emptyItems);
    setFinalGIF(null);
    setFinalGIFUrl(null);
  };

  const publish = async () => {
    if (!confirm("Are you sure you want to publish this GIF publicly?")) return

    const response = await fetch(`${baseUrl}/api/generate-gif-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gif: finalGIFUrl }) });
    const blob = await response.blob();
    const uniqueFilename = `preview-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
    await supabase.storage.from('images').upload(`public/${uniqueFilename}`, blob, { cacheControl: '3600', upsert: false });

    const gifPreviewUrl = `${supabaseUrl}/storage/v1/object/public/images/public/${uniqueFilename}`;

    const { data } = await supabase.from("gifs").select().eq('gif_url', finalGIFUrl)

    if (data.length) {
      alert("GIF already published!")
      return
    }

    await supabase
      .from('gifs')
      .insert({ gif_url: finalGIFUrl, preview_url: gifPreviewUrl })

    alert("GIF published successfully!")
  }

  const SortableItem = (({ value }) => {
    const fileInputRef = useRef();
    return (
      <li className='frame'>
        {value.loading && <div className='loading'>Uploading...</div>}
        {!value.image &&
          <div className='actions'>
            <button onClick={() => fileInputRef.current.click()}>Upload</button>
            <input type='file' ref={fileInputRef} hidden onChange={e => handleFrameUpload(e.target.files[0], value.key)} />
            <button onClick={() => handleTextFrame(value.key)}>Enter text</button>
          </div>
        }
        {value.image && <>
          <img src={value.image} alt="frame" />
          <button className='delete-frame-image' onClick={() => handleDeleteFrame(value.key)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
              <path d="M16 12H8M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>}
      </li>
    );
  });

  return (
    <div className="app">
      {/* <div className='main-header'>
        <Link className='active' to={'/'}>GIFs</Link>
        <Link to={'/books'}>BOOKs</Link>
        <Link to={'/tools'}>TOOLs</Link>
      </div> */}

      {letsGo ? (
        !finalGIF ? (
          <div className='personalisation' style={loading ? { pointerEvents: 'none' } : {}}>
            <ul className='frames'>
              {items.map((value, index) => <SortableItem key={`item-${value.key}`} index={index} value={value} />)}
            </ul>
            <button onClick={generateGIF} disabled={loading} className='generate'>{loading ? 'Please Wait' : 'Generate GIF'}</button>
          </div>
        ) : (
          <div className='personalisation done'>
            <img src={finalGIFUrl} alt="Generated GIF" />
            <h1>Done!</h1>
            <p>You can now download your GIF.</p>

            <div className='actions'>
              <button onClick={resetApp} className='start-anew'>Start a New GIF</button>
              <button onClick={downloadGIF} className='download'>Download GIF</button>
              <button onClick={publish} className='publish'>Publish Anonymously</button>
            </div>
          </div>
        )
      ) : (
        <div className='file-uploader'>
          <div className='details'>
            <img className='logo' src="/logo-black.png" alt="logo" />
            <h1>Make Personalised GIFs</h1>
            <p>Using only text, images, or both.</p>
            <p>GIFs within the GIF works too.</p>
            <button onClick={() => setLetsGo(true)} className='upload'>Let's go!</button>
          </div>
        </div>
      )}

      <h2 className='last-100-title'>Last GIFs published</h2>

      <div className='list'>
        {gifs.map((gif, index) => <Post key={index} gif={gif} />)}
      </div>

      {/* <h2 className='last-100-title'>
        GIF-reading Books
        <span className='languages'>
          <span onClick={() => setLanguage('en')} className={language === 'en' ? 'language active' : 'language'}>EN</span>
          <span onClick={() => setLanguage('ro')} className={language === 'ro' ? 'language active' : 'language'}>RO</span>
        </span>
      </h2>

      <div className='list'>
        {gifs.map((gif, index) => <Post key={index} gif={gif} />)}
      </div> */}
    </div>
  );
}

const Post = ({ gif }) => {
  const [playGIF, setPlayGIF] = useState(false);
  const img = new Image();
  img.src = gif.gif_url;
  const url = playGIF ? gif.gif_url : gif.preview_url
  return (
    <div className="post" onClick={() => setPlayGIF(!playGIF)}>
      {!playGIF && <div className='play-gif'>►</div>}
      <LazyLoad width={230} height={230}><img src={url} alt="gif" /></LazyLoad>
    </div>
  );
};

const truncateString = (str) => {
  if (str.length > 40) {
    return str.slice(0, 40) + '...';
  } else {
    return str;
  }
}

const resizeFile = (file) =>
  file.type === 'image/gif' ? file : new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      1000,
      1000,
      "JPEG",
      80,
      0,
      (uri) => {
        resolve(uri);
      },
      "blob",
      400,
      400
    );
  });
