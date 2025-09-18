<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;

// User authentication
Route::post('/signup', [AccountController::class, 'createAccount']); 
Route::post('/signin', [AccountController::class, 'signIn']);       

// Admin / CRUD
Route::get('/get-all-accounts', [AccountController::class, 'getAllAccounts']);
Route::get('/account/{id}', [AccountController::class, 'getAccount']); 
Route::put('/account/{id}', [AccountController::class, 'updateAccount']); 
Route::delete('/account/{id}', [AccountController::class, 'deleteAccount']);
