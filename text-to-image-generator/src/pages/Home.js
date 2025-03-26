import React from "react";
import "./home.css";
import { Button } from "react-bootstrap";
import { FaSnapchat } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
function Home() {
  return (
    <>
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center bg-dark text-white p-5">
        {/* Slogan chính */}
        <h3 className="text-secondary fw-semibold">AI That Talks & Creates</h3>
        {/* Tiêu đề chính với hiệu ứng gradient */}
        <h1 className="fw-bold display-4 mt-2">
          <span className="gradient-text">Chat Smart, Generate Art!</span>
        </h1>
        {/* Mô tả chính */}
        <h4 className="text-light fw-semibold mt-3">
          Your AI Companion for Conversations & Creativity
        </h4>
        <p className="text-secondary w-75 mt-3">
          Experience the power of AI in two amazing ways! Chat seamlessly with
          our intelligent AI chatbot to get instant answers, brainstorm ideas,
          or simply have fun conversations. Feeling creative? Enter a text
          prompt and watch AI turn your words into stunning images. Whether you
          need assistance or inspiration, we've got you covered!
        </p>
        <div className="d-flex gap-3 mt-4">
          <Button
            variant="outline-light"
            className="custom-btn"
            href="/chatbot"
          >
            <FaSnapchat className="me-2" /> Chat now
          </Button>
          <Button
            variant="outline-light"
            className="custom-btn"
            href="/generator"
          >
            <GiArtificialIntelligence className="me-2" /> AI Image Generator
          </Button>
        </div>
      </div>

      <div
        className="home-container d-flex align-items-center justify-content-center rounded p-5"
        style={{ minHeight: "600px", background: "var(--bgmain-color)" }}
      >
        <div className="row w-100">
          {/* Cột Văn Bản */}
          <div className="col-md-6 text-light d-flex flex-column align-self-center">
            <h4 className="fw-bold">
              Create Stunning Images Instantly With AI
            </h4>
            <p className="text-light" style={{ fontSize: "0.8rem" }}>
              Unlock your creative potential with our AI-powered tool, perfect
              for generating stunning images in seconds. Whether you're starting
              from scratch or transforming an existing photo, our tool offers
              two simple ways to bring your vision to life. Enter a text prompt
              and watch as AI generates four unique image samples based on your
              description. Alternatively, upload your own photo and let AI
              transform it into the design you envision. With these versatile
              options, creating beautiful images has never been easier.
            </p>
          </div>

          {/* Cột Hình Ảnh */}
          <div className="col-md-6 d-flex justify-content-end position-relative">
            <div className="image-container rounded">
              <img
                src="/login-img.png"
                alt="AI Generated Art"
                className="img-fluid rounded-5 "
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="home-container d-flex align-items-center justify-content-center rounded p-5"
        style={{ minHeight: "600px", background: "var(--bgmain-color)" }}
      >
        <div className="row w-100">
          {/* Cột Văn Bản */}

          <div className="col-md-6 text-light d-flex align-items-center">
            <div className="image-container">
              <img
                src="/sign-up.png"
                alt="AI Generated Art"
                className="img-fluid rounded-5"
              />
            </div>
          </div>

          {/* Cột Hình Ảnh */}
          <div className="col-md-6 d-flex flex-column align-self-center">
            <h4 className="fw-bold text-light">
              Generate Unique Image Styles With Text To Image
            </h4>
            <p className="text-light" style={{ fontSize: "0.8rem" }}>
              Explore a world of creativity with Pixlr's 16 unique style
              options, designed to transform your images into captivating works
              of art. Whether you're looking to add a touch of anime, digital
              art, neon punk, cinematic, photographic, or simply enhance your
              photos, there's a style to suit every mood and theme. Feeling
              dramatic? The cinematic style adds a rich, movie-like flair to
              your images, perfect for creating striking visuals. For a
              futuristic and edgy feel, the neon punk style infuses vibrant,
              bold colors that make your creations stand out. Each style is
              meticulously crafted to elevate your photos, providing you with
              the flexibility to align your visuals with any aesthetic or
              purpose.
            </p>
          </div>
        </div>
      </div>
      <div
        className="home-container d-flex align-items-center justify-content-center rounded p-5"
        style={{ minHeight: "600px", background: "var(--bgmain-color)" }}
      >
        <div className="row w-100">
          {/* Cột Văn Bản */}
          <div className="col-md-6 text-light d-flex flex-column align-self-center">
            <h4 className="fw-bold">How to make AI-generated images</h4>
            <ul className="list-unstyled">
              <li className="d-flex align-items-start mb-3">
                <span className="step-number">1</span>
                <p className="text-light ms-3">
                  Tap the input at the top and describe the image you’d like to
                  generate. The more detail you can provide, the better.
                </p>
              </li>
              <li className="d-flex align-items-start mb-3">
                <span className="step-number">2</span>
                <p className="text-light ms-3">
                  When using <strong>Text to Image</strong>, you can also choose
                  an image style from our available options like Enhance, Anime,
                  Digital-Art, Neon Punk, Cinematic etc. Then, click Generate
                  image.
                </p>
              </li>
              <li className="d-flex align-items-start mb-3">
                <span className="step-number">3</span>
                <p className="text-light ms-3">
                  Additional Image Generator options include Size/Aspect ratio
                  and color, lighting and composition preferences for your
                  generated photo.
                </p>
              </li>
              <li className="d-flex align-items-start">
                <span className="step-number">4</span>
                <p className="text-light ms-3">
                  When the image is generated, tap on the photo to download,{" "}
                  <a href="#" className="text-primary">
                    Edit Photo
                  </a>{" "}
                  or use{" "}
                  <a href="#" className="text-primary">
                    Face Swap
                  </a>
                  .
                </p>
              </li>
            </ul>
          </div>

          {/* Cột Hình Ảnh */}
          <div className="col-md-6 d-flex justify-content-end position-relative">
            <div className="image-container rounded">
              <img
                src="/camera.png"
                alt="AI Generated Art"
                className="img-fluid rounded-5 "
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
