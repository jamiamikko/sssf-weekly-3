const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('sass', () => {
    gulp.src('./public/assets/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./public/assets/css'));
});

gulp.task('watch', () => {
    gulp.watch('./public/assets/sass/*.scss', ['sass']);
});

gulp.task('default', ['sass', 'watch']);
