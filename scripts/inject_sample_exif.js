const fs = require('fs');
const piexif = require('piexifjs');

function injectExif(filePath, exifData) {
  const fileData = fs.readFileSync(filePath);
  const jpegString = fileData.toString('binary');

  const zeroth = {};
  const exif = {};
  const gps = {};

  if (exifData.make) zeroth[piexif.ImageIFD.Make] = exifData.make;
  if (exifData.model) zeroth[piexif.ImageIFD.Model] = exifData.model;
  if (exifData.artist) zeroth[piexif.ImageIFD.Artist] = exifData.artist;
  if (exifData.dateTime) zeroth[piexif.ImageIFD.DateTime] = exifData.dateTime;
  if (exifData.software) zeroth[piexif.ImageIFD.Software] = exifData.software;

  if (exifData.dateTimeOriginal) exif[piexif.ExifIFD.DateTimeOriginal] = exifData.dateTimeOriginal;
  if (exifData.fNumber) exif[piexif.ExifIFD.FNumber] = exifData.fNumber;
  if (exifData.exposureTime) exif[piexif.ExifIFD.ExposureTime] = exifData.exposureTime;
  if (exifData.iso) exif[piexif.ExifIFD.ISOSpeedRatings] = exifData.iso;
  if (exifData.focalLength) exif[piexif.ExifIFD.FocalLength] = exifData.focalLength;
  if (exifData.focalLengthIn35mm) exif[piexif.ExifIFD.FocalLengthIn35mmFilm] = exifData.focalLengthIn35mm;
  if (exifData.lensModel) exif[piexif.ExifIFD.LensModel] = exifData.lensModel;
  if (exifData.exposureBias) exif[piexif.ExifIFD.ExposureBiasValue] = exifData.exposureBias;

  const exifObj = { '0th': zeroth, 'Exif': exif, 'GPS': gps };
  const exifBytes = piexif.dump(exifObj);
  const newJpegString = piexif.insert(exifBytes, jpegString);
  const newBuffer = Buffer.from(newJpegString, 'binary');

  fs.writeFileSync(filePath, newBuffer);
  console.log(`Successfully injected EXIF into ${filePath}`);
}

injectExif('assets/sample1.jpg', {
  make: 'SONY',
  model: 'ILCE-7RM4',
  lensModel: 'FE 35mm F1.4 GM',
  fNumber: [14, 10], // f/1.4
  exposureTime: [1, 160], // 1/160s
  iso: 800,
  focalLength: [35, 1],
  focalLengthIn35mm: 35,
  exposureBias: [-1, 3],
  dateTimeOriginal: '2024:10:18 21:42:15',
  dateTime: '2024:10:18 21:42:15',
  artist: 'Shinjuku Night Walk',
  software: 'SpecFrame v1.0'
});

injectExif('assets/sample2.jpg', {
  make: 'FUJIFILM',
  model: 'X-T5',
  lensModel: 'XF16-55mmF2.8 R LM WR',
  fNumber: [80, 10], // f/8.0
  exposureTime: [1, 250], // 1/250s
  iso: 125,
  focalLength: [33, 1],
  focalLengthIn35mm: 50,
  exposureBias: [0, 1],
  dateTimeOriginal: '2024:11:02 06:15:30',
  dateTime: '2024:11:02 06:15:30',
  artist: 'Lake Kawaguchiko Sunrise',
  software: 'SpecFrame v1.0'
});
