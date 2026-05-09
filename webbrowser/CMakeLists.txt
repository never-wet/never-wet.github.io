cmake_minimum_required(VERSION 3.16)
project(VibeBrowser LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Qt5 Core, Widgets, and WebEngine components
find_package(Qt5 COMPONENTS Core Widgets WebEngineWidgets REQUIRED)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)

add_executable(VibeBrowser main.cpp)

# Link the libraries
target_link_libraries(VibeBrowser PRIVATE Qt5::Core Qt5::Widgets Qt5::WebEngineWidgets)