#include <iostream>
using namespace std;
int main() {
    double fahren, celsius;

    cout << "Enter Fahrenheit Temperature: ";
    cin >> fahren;

    celsius = (fahren - 32)/1.8;

    cout << "Temperature in Celsius is: " << celsius << endl;
}
