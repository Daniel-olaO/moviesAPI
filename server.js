const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const Movie = require('./model/moviesDB');
const HTTP_PORT = process.env.PORT || 8080


app.use(cors('*'));
app.use(passport.initialize());

// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_SECRET;

let payLoad = {
    _id: "kush",
    userName: "dan"
}
var strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) =>{
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName
        }); 
    } else {
        next(null, false);
    }
});
passport.use(strategy);
var token = jwt.sign(payLoad, jwtOptions.secretOrKey);

const db = new Movie(process.env.MONGOSTRING)

app.get('/', (req, res)=>{
    res.json({
        "message":"API Listening", "token":token
    });
});
app.post('/api/movies',passport.authenticate('jwt', { session: false }),(req,res)=>{
    db.addNewMovie(req.body).then((msg)=>{
        res.status(201).json({
            "messege":msg
        });
    }).catch(()=>{
        res.status(400).json({
            "error":'error adding new movie'
        });
    });
});
app.get('/api/movies',passport.authenticate('jwt', { session: false }),(req,res)=>{
    let {page} = req.query;
    if(page != undefined ){
        db.getAllMovies(page,10)
        .then((data)=>res.status(201).json(data))
        .catch(err=>res.status(404).json(err));
    }
    else
        res.status(404).json({
            "error":"nothing returned"
        })
});
app.get('/api/movies/:id',passport.authenticate('jwt', { session: false }),(req, res)=>{
    db.getMovieById(req.params.id)
    .then((data)=>{
        res.status(201).json(data);
    })
    .catch((err)=>{
       res.status(404).json(err) 
    })
    });
app.put('/api/movies/:id',passport.authenticate('jwt', { session: false }),(res,req)=>{
    db.getMovieById(req.params.id)
    .then(()=>{
        db.updateMovieById(req.body, req.params.id)
        .then(msg=>{
            res.status(200).json({
                message: `movie ${req.params.id} updated`
              });
        }).catch(()=>{
            res.status(404).json({
                message: `movie ${req.params.id} could not be updated`
            });
        });
    }).catch(()=>{
        res.status(500).json({
          message: `movie ${req.params.id} could not be found`
        });
    });
})
app.delete('/api/movie/:_id',passport.authenticate('jwt', { session: false }), (req, res)=>{
    db.deleteMovietById(req.params._id).then(()=>{
      res.status(204).end();
    }).catch((err)=>{
      res.status(404).json({
        error: err
      });
    });
  }); 
db.initailize()
.then((msg)=>{
    app.listen(HTTP_PORT,()=>{
        console.log(`${msg} and server is running on port:${HTTP_PORT}`);
    });
})
.catch((err)=>{
    console.log(err);
})