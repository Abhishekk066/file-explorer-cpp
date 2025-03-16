#include <iostream>
using namespace std;

void swap(int &x, int &y){
    int z;
    z = x;
    x = y;
    y = z;
}

int main(){
    int a, b;

    cout << "Enter number a: ";
    cin >> a;
    cout << "Enter number b: ";
    cin >> b;

    cout << "Before swapping a: " << a << ", b: " << b << endl;
    swap(a, b);
    cout << "After swapping a: " << a << ", b: " << b << endl;
    return 0;
}
