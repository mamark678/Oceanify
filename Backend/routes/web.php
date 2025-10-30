<?php

use Illuminate\Support\Facades\Route;

// API routes should be in routes/api.php
// This catches all routes and serves the React app

Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api).*$');