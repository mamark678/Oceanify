<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\UserController;

Route::get('/accounts', [AccountController::class, 'index']);
Route::post('/accounts', [AccountController::class, 'store']);
Route::put('/accounts/{id}', [AccountController::class, 'update']);
Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);
