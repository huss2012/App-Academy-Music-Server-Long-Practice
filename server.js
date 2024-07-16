const http = require('http');
const fs = require('fs');


/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    /*==========================GET /artists Route==========================*/
    if (req.method === "GET" && req.url === "/artists") {

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.write(JSON.stringify(artists));
      return res.end()
    }
    /*==========================GET /artists/:artistId Route==================*/
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 3) {
        const parsedArtistId = Number(urlParts[2]);
        const artistName = artists[parsedArtistId].name;
        const artistId = artists[parsedArtistId].artistId;
        const albumName = albums[parsedArtistId].name;
        const albumId = albums[parsedArtistId].albumId;

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify({
          name: artistName,
          artistId: artistId,
          album: [
            {
              name: albumName,
              albumId: albumId,
              artistId: artistId
            }
          ]
        }));
        return res.end();
      }
    }

    /*==========================POST /artists Route==================*/
    if (req.method === "POST" && req.url === "/artists") {
      const artistName = req.body.name;
      artists[nextArtistId] = {
        artistId: nextArtistId,
        name: artistName
      };
      albums[nextAlbumId] = {
        artistId: nextArtistId
      };
      songs[nextSongId] = {
        albumId: nextAlbumId
      };

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 201;
      res.write(JSON.stringify({
        artistId: nextArtistId,
        name: artistName
      }));

      getNewArtistId();
      getNewAlbumId();
      getNewSongId();

      return res.end();
    }
    /*==========================PUT /artists/:artistId Route=============*/
    if (req.method === "PUT" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 3) {
        const targetedArtistId = urlParts[2];
        const newUserName = req.body.name;
        artists[targetedArtistId].name = newUserName;
        artists[targetedArtistId].updatedAt = Date();

        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
          name: artists[targetedArtistId].name,
          artistId: artists[targetedArtistId].artistId,
          updatedAt: artists[targetedArtistId].updatedAt
        }));
        return res.end();
      }
    }
    /*==========================DELETE /artists/:artistId Route=============*/
    if (req.method === "DELETE" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      const targetedArtistId = urlParts[2];

      delete artists[targetedArtistId];

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.write(JSON.stringify({
        message: "Successfully deleted"
      }));
      return res.end();
    }
    /*==========================GET /artists/:artistId/albums Route=============*/
    if (req.method === "GET" && req.url.startsWith("/artists") && req.url.endsWith("/albums")) {
      urlParts = req.url.split("/");
      if (urlParts.length === 4) {
        const targetedArtistId = urlParts[2];
        const targetedAlbum = albums[targetedArtistId];

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify([
          {
            name: targetedAlbum.name,
            albumId: targetedAlbum.albumId,
            artistId: targetedAlbum.artistId
          }
        ]));
        return res.end();
      }
    }
    /*==========================GET /albums/:albumId Route=============*/
    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 3) {
        const targetedAlbumId = Number(urlParts[2]);
        const targetedAlbum = albums[targetedAlbumId];
        const targetedArtist = artists[targetedAlbum.artistId];
        const searchForSong = (songs, targetedAlbumId) => {
          for (const key in songs) {
            if (songs[key].albumId === targetedAlbumId) {
              return songs[key];
            } else {
              return null;
            }
          }
        };
        const targetedSong = searchForSong(songs, targetedAlbumId);

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify({
          name: targetedAlbum.name,
          albumId: targetedAlbum.albumId,
          artistId: targetedArtist.artistId,
          artist: {
            name: targetedArtist.name,
            artistId: targetedArtist.artistId
          },
          songs: [
            {
              name: targetedSong.name,
              lyrics: targetedSong.lyrics,
              trackNumber: targetedSong.trackNumber,
              songId: targetedSong.songId,
              createSt: Date(),
              updatedAt: Date(),
              albumId: targetedAlbum.albumId
            }
          ]
        }));
        return res.end();
      }
    };
    /*==========================POST /artist/:artistId/albums Route=============*/
    if (req.method === "POST" & req.url.startsWith("/artists") && req.url.endsWith("/albums")) {
      const newAlbumName = req.body.name;
      const urlParts = req.url.split("/");
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        albums[nextAlbumId] = {
          albumId: nextArtistId,
          name: newAlbumName,
          artistId: artistId
        };

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.write(JSON.stringify({
          name: newAlbumName,
          albumId: nextAlbumId,
          artistId: artistId
        }));
        getNewAlbumId();
      }


      return res.end();
    }
    /*==========================PUT /albums/:artistId Route=============*/
    if (req.method === "PUT" && req.url.startsWith("/albums")) {
      const urlParts = req.url.split("/");
      const newAlbumName = req.body.name;

      if (urlParts.length === 3) {
        const albumId = Number(urlParts[2]);
        albums[albumId].name = newAlbumName;
        albums[albumId].updatedAt = Date();

        const updatedAlbumName = albums[albumId].name;
        const artistId = albums[albumId].artistId;
        const updatedAt = albums[albumId].updatedAt;

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify({
          name: updatedAlbumName,
          albumId: albumId,
          artistId: artistId,
          updatedAt: updatedAt
        }));
      }
      return res.end();
    }
    /*==========================DELETE /albums/:artistId Route=============*/
    if (req.method === "DELETE" && req.url.startsWith("/albums")) {
      const urlParts = req.url.split("/");
      const targetedAlbumId = Number(urlParts[2]);

      if (urlParts.length === 3) {
        delete albums[targetedAlbumId];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
          message: "Successfully deleted"
        }));
      }
      return res.end();
    }
    /*==========================GET /artists/:artistId/songs Route=============*/
    if (req.method === "GET" && req.url.startsWith("/artists") && req.url.endsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedArtistId = Number(urlParts[2]);
      const searchForAlbumId = (albums, targetedArtistId) => {
        for (const key in albums) {
          if (albums[key].artistId === targetedArtistId) {
            return albums[key].albumId;
          } else {
            return null;
          }
        }
      };
      const targetedAlbumId = searchForAlbumId(albums, targetedArtistId);

      const searchForSong = (songs, targetedAlbumId) => {
        for (const key in songs) {
          if (songs[key].albumId === targetedAlbumId) {
            return songs[key];
          } else {
            return null;
          }
        }
      };
      const targetedSong = searchForSong(songs, targetedAlbumId)

      if (urlParts.length === 4) {
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify([{
          name: targetedSong.name,
          lyrics: targetedSong.lyrics,
          trackNumber: targetedSong.trackNumber,
          songId: targetedSong.songId,
          albumId: targetedSong.albumId
        }]));
      }
      return res.end();
    };
    /*==========================GET /albums/:albumId/songs Route=============*/
    if (req.method === "GET" && req.url.startsWith("/albums") && req.url.endsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedAlbumId = Number(urlParts[2]);
      const searchForSongBasedOnAlbumId = (songs, targetedAlbumId) => {
        const arrOfSongs = [];
        for (const key in songs) {
          if (songs[key].albumId === targetedAlbumId) {
            arrOfSongs.push(songs[key]);
          } else {
            return null;
          }
          return arrOfSongs;//{1:{}}
        }
      }
      const targetedSong = searchForSongBasedOnAlbumId(songs, targetedAlbumId);
      if (urlParts.length === 4) {

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(targetedSong));
      }
      return res.end();
    }
    /*==========================GET /trackNumbers/:trackNumberId/songs Route=============*/
    if (req.method === "GET" && req.url.startsWith("/trackNumbers")) {
      const urlParts = req.url.split("/");
      const targetedTrackNumberId = Number(urlParts[2]);
      const searchForSongsByTrackNumberId = (songs, targetedTrackNumberId) => {
        const arrOfSongs = [];
        for (const key in songs) {
          if (songs[key].trackNumber === targetedTrackNumberId) {
            arrOfSongs.push(songs[key]);
          } else {
            return null;
          }
        }
        return arrOfSongs;
      }
      const targetedSong = searchForSongsByTrackNumberId(songs, targetedTrackNumberId);
      if (urlParts.length === 4) {

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(targetedSong));
      }
      return res.end();
    };
    /*==========================GET /songs/:songId Route=============*/
    if (req.method === "GET" && req.url.startsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedSongId = Number(urlParts[2]);
      const targetedSong = songs[targetedSongId];
      const targetedAlbum = albums[targetedSong.albumId];
      const targetedArtist = artists[targetedAlbum.artistId];
      if (urlParts.length === 3) {

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
          name: targetedSong.name,
          lyrics: targetedSong.lyrics,
          trackNumber: targetedSong.trackNumber,
          songId: targetedSong.songId,
          albumId: targetedSong.albumId,
          album: {
            name: targetedAlbum.name,
            albumId: targetedAlbum.albumId,
            artistId: targetedAlbum.artistId
          },
          artist: {
            name: targetedArtist.name,
            artistId: targetedArtist.artistId
          }
        }));
      };
      return res.end();
    };
    /*==========================POST /albums/:albums/songs Route=============*/
    if (req.method === "POST" && req.url.startsWith("/albums") && req.url.endsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedAlbumId = Number(urlParts[2]);
      songs[nextSongId] = {
        songId: nextSongId,
        name: req.body.name,
        trackNumber: req.body.trackNumber,
        albumId: targetedAlbumId,
        lyrics: req.body.lyrics
      };

      if (urlParts.length === 4) {

        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
          songId: nextSongId,
          name: req.body.name,
          trackNumber: req.body.trackNumber,
          albumId: targetedAlbumId,
          lyrics: req.body.lyrics
        }));
      }
      getNewSongId();
      return res.end();
    }
    /*==========================PUT /songs/:songId Route=============*/
    if (req.method === "PUT" && req.url.startsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedSongId = Number(urlParts[2]);
      songs[targetedSongId].name = req.body.name;
      songs[targetedSongId].lyrics = req.body.lyrics;
      songs[targetedSongId].trackNumber = req.body.trackNumber;
      songs[targetedSongId].updatedAt = Date();

      if (urlParts.length === 3) {

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify({
          songId: targetedSongId,
          name: req.body.name,
          trackNumber: req.body.trackNumber,
          albumId: songs[targetedSongId].albumId,
          lyrics: req.body.lyrics,
          updatedAt: songs[targetedSongId].updatedAt
        }));
      };
      return res.end();
    };
    /*==========================DELETE /songs/:songId Route=============*/
    if (req.method === "DELETE" && req.url.startsWith("/songs")) {
      const urlParts = req.url.split("/");
      const targetedSongId = Number(urlParts[2]);

      if (urlParts.length === 3) {
        delete songs[targetedSongId];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
          message: "Successfully deleted"
        }));
      };
      return res.end();
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
