// Set up video element
const video = document.getElementById('video');

// Load models and start the video
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(startVideo);


// Start video stream
function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error('Failed to get video stream:', err));
}

video.onloadedmetadata = () => {
  video.play();
};

// Set up event listener for when the video starts playing
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
    
    // Resize detections to fit the display size
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Clear the canvas before drawing new detections
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face detection boxes
    faceapi.draw.drawDetections(canvas, resizedDetections);
    
    // Draw face landmarks (optional, you can remove this if you don't need landmarks)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    // Draw age and gender
    resizedDetections.forEach(detection => {
      const { age, gender, genderProbability } = detection;
      const probability = parseInt(genderProbability * 100, 10);
      
      // Display age and gender information
      new faceapi.draw.DrawTextField(
        [
          `${parseInt(age, 10)} years`,
          `${gender} (${probability}%)`
        ],
        detection.detection.box.bottomRight
      ).draw(canvas);
    });
  }, 100);
});
